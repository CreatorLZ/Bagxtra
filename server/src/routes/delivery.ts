import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validation.js';
import { DeliveryService } from '../services/DeliveryService.js';
import {
  MatchRepository,
  ShopperRequestRepository,
} from '../services/repositoryImpl.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

// Validation schemas
const matchIdSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

const generatePinSchema = z.object({
  storeLocation: z.string().min(1),
});

const verifyPinSchema = z.object({
  pin: z.string().length(5),
});

// Error sanitizer for secure logging
const sanitizeError = (error: any) => ({
  message: error?.message || 'Unknown error',
  correlationId: randomUUID(),
});

// Initialize service
const matchRepo = new MatchRepository();
const shopperRequestRepo = new ShopperRequestRepository();
const deliveryService = new DeliveryService(matchRepo, shopperRequestRepo);

const router = Router();

/**
 * @route POST /api/delivery/:matchId/generate-pin
 * @desc Generate delivery verification PIN (Traveler)
 * @access Private (Traveler only)
 */
router.post('/:matchId/generate-pin', requireAuth, authorizeRoles('traveler'), validateParams(matchIdSchema), async (req, res) => {
  try {
    const matchId = req.params['matchId'] as string;
    const { storeLocation } = generatePinSchema.parse(req.body);

    // Get traveler ID from auth middleware
    const travelerId = req.user?.id;
    if (!travelerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    let travelerObjectId: mongoose.Types.ObjectId;
    try {
      travelerObjectId = new mongoose.Types.ObjectId(travelerId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid traveler ID'
      });
    }

    const result = await deliveryService.generateVerificationPin(
      { matchId, storeLocation },
      travelerObjectId
    );

    res.status(200).json({
      success: true,
      message: 'Delivery PIN generated successfully',
      data: {
        pin: result.pin,
        expiresAt: result.expiresAt,
        instructions: 'Provide this PIN to the shopper for item pickup verification'
      },
    });
  } catch (error) {
    console.error('Error generating delivery PIN:', sanitizeError(error));

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate delivery PIN',
    });
  }
  return;
});

/**
 * @route POST /api/delivery/:matchId/verify-pin
 * @desc Verify delivery PIN (Shopper)
 * @access Private (Shopper only)
 */
router.post('/:matchId/verify-pin', requireAuth, authorizeRoles('shopper'), validateParams(matchIdSchema), async (req, res) => {
  try {
    const matchId = req.params['matchId'] as string;
    const { pin } = verifyPinSchema.parse(req.body);

    // Get shopper ID from auth middleware
    const shopperId = req.user?.id;
    if (!shopperId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shopper ID'
      });
    }

    const result = await deliveryService.verifyDeliveryPin(
      { matchId, pin },
      shopperObjectId
    );

    if (!result.verified) {
      return res.status(400).json({
        error: 'Verification Failed',
        message: result.error || 'PIN verification failed',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery PIN verified successfully. Order completed!',
      data: {
        matchId: result.match?._id,
        status: result.match?.status,
        completedAt: result.match?.completedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying delivery PIN:', sanitizeError(error));

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify delivery PIN',
    });
  }
  return;
});

/**
 * @route GET /api/delivery/:matchId/status
 * @desc Get delivery status
 * @access Private (Traveler or Shopper)
 */
router.get('/:matchId/status', requireAuth, authorizeRoles('traveler', 'shopper'), validateParams(matchIdSchema), async (req, res) => {
  try {
    const matchId = req.params['matchId'] as string;
    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const status = await deliveryService.getDeliveryStatus(matchObjectId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting delivery status:', sanitizeError(error));
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get delivery status',
    });
  }
  return;
});

/**
 * @route POST /api/delivery/:matchId/deliver-to-vendor
 * @desc Mark item as delivered to vendor (Traveler)
 * @access Private (Traveler only)
 */
router.post('/:matchId/deliver-to-vendor', requireAuth, authorizeRoles('traveler'), validateParams(matchIdSchema), async (req, res) => {
  try {
    const matchId = req.params['matchId'] as string;
    // Get traveler ID from auth middleware
    const travelerId = req.user?.id;
    if (!travelerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    let travelerObjectId: mongoose.Types.ObjectId;
    try {
      travelerObjectId = new mongoose.Types.ObjectId(travelerId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid traveler ID'
      });
    }

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const updatedMatch = await deliveryService.markAsDelivered(matchObjectId, travelerObjectId);

    if (!updatedMatch) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Match not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item marked as delivered to vendor',
      data: {
        matchId: updatedMatch._id,
        status: updatedMatch.status,
        deliveredAt: updatedMatch.deliveredToVendorAt,
      },
    });
  } catch (error) {
    console.error('Error marking delivery to vendor:', sanitizeError(error));
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark delivery to vendor',
    });
  }
  return;
});

/**
 * @route POST /api/delivery/:matchId/resend-pin
 * @desc Resend delivery verification PIN (Traveler)
 * @access Private (Traveler only)
 */
router.post('/:matchId/resend-pin', requireAuth, authorizeRoles('traveler'), validateParams(matchIdSchema), async (req, res) => {
  try {
    const matchId = req.params['matchId'] as string;
    // Get traveler ID from auth middleware
    const travelerId = req.user?.id;
    if (!travelerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    let travelerObjectId: mongoose.Types.ObjectId;
    try {
      travelerObjectId = new mongoose.Types.ObjectId(travelerId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid traveler ID'
      });
    }

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const result = await deliveryService.resendVerificationPin(matchObjectId, travelerObjectId);

    res.status(200).json({
      success: true,
      message: 'New delivery PIN generated',
      data: {
        pin: result.pin,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error resending delivery PIN:', sanitizeError(error));
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resend delivery PIN',
    });
  }
  return;
});

export default router;