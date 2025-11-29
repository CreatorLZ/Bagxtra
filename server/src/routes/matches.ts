import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validation.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import { BookingService } from '../services/BookingService.js';
import {
  MatchRepository,
  ShopperRequestRepository,
  TripRepository,
  BagItemRepository,
  UserRepository,
} from '../services/repositoryImpl.js';

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

const claimMatchSchema = z.object({
  assignedItems: z.array(z.string()).min(1),
});

const approveMatchSchema = z.object({});

const cancelMatchSchema = z.object({
  reason: z.string().optional(),
});

const rejectMatchSchema = z.object({
  reason: z.string().optional(),
});

const purchaseMatchSchema = z.object({
  receiptUrl: z.string().url(),
});

// Initialize service
const matchRepo = new MatchRepository();
const shopperRequestRepo = new ShopperRequestRepository();
const tripRepo = new TripRepository();
const bagItemRepo = new BagItemRepository();
const userRepo = new UserRepository();
const bookingService = new BookingService(
  matchRepo,
  shopperRequestRepo,
  tripRepo,
  bagItemRepo,
  userRepo
);

const router = Router();

/**
 * @route POST /api/matches/:id/claim
 * @desc Traveler claims a match (assigns specific items)
 * @access Private (Traveler only)
 */
router.post(
  '/:id/claim',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }
      const { assignedItems } = claimMatchSchema.parse(req.body);

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid traveler ID',
        });
      }

      const match = await bookingService.claimMatch(travelerObjectId, {
        matchId: id,
        assignedItems,
      });

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match claimed successfully',
        data: {
          id: match._id,
          status: match.status,
          assignedItems: match.assignedItems,
        },
      });
    } catch (error) {
      console.error('Error claiming match:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to claim match',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/approve
 * @desc Shopper approves a claimed match (starts cooldown)
 * @access Private (Shopper only)
 */
router.post(
  '/:id/approve',
  requireAuth,
  authorizeRoles('shopper'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }
      approveMatchSchema.parse(req.body); // Validate empty body

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid shopper ID',
        });
      }

      const match = await bookingService.approveMatch(shopperObjectId, {
        matchId: id,
      });

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match approved successfully. Cooldown period started.',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error approving match:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to approve match',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/cancel
 * @desc Cancel a match during cooldown period
 * @access Private (Shopper or Traveler)
 */
router.post(
  '/:id/cancel',
  requireAuth,
  authorizeRoles('shopper', 'traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }
      const { reason } = cancelMatchSchema.parse(req.body);

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

      // Get user ID from auth middleware
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      let userObjectId: mongoose.Types.ObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user ID',
        });
      }

      const match = await bookingService.cancelMatchDuringCooldown(
        userObjectId,
        {
          matchId: id,
          reason,
        }
      );

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match cancelled successfully',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error cancelling match:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cancel match',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/accept
 * @desc Traveler accepts a pending match (direct booking)
 * @access Private (Traveler only)
 */
router.post(
  '/:id/accept',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid traveler ID',
        });
      }

      const match = await bookingService.acceptPendingMatch(
        travelerObjectId,
        id
      );

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match accepted successfully',
        data: {
          id: match._id,
          status: match.status,
          assignedItems: match.assignedItems,
        },
      });
    } catch (error) {
      console.error('Error accepting match:', error);

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to accept match',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/reject
 * @desc Traveler rejects a pending match
 * @access Private (Traveler only)
 */
router.post(
  '/:id/reject',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }
      const { reason } = rejectMatchSchema.parse(req.body);

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid traveler ID',
        });
      }

      const match = await bookingService.rejectPendingMatch(
        travelerObjectId,
        id,
        reason
      );

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match rejected successfully',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error rejecting match:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to reject match',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/pay
 * @desc Shopper marks match as paid
 * @access Private (Shopper only)
 */
router.post(
  '/:id/pay',
  requireAuth,
  authorizeRoles('shopper'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid shopper ID',
        });
      }

      const match = await bookingService.payMatch(shopperObjectId, id);

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error processing payment:', error);

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process payment',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/purchase
 * @desc Traveler marks item as purchased with receipt
 * @access Private (Traveler only)
 */
router.post(
  '/:id/purchase',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { receiptUrl } = purchaseMatchSchema.parse(req.body);

      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid traveler ID',
        });
      }

      const match = await bookingService.purchaseMatch(travelerObjectId, {
        matchId: id,
        receiptUrl,
      });

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Item purchase confirmed successfully',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error processing purchase:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process purchase',
      });
    }
    return;
  }
);

/**
 * @route POST /api/matches/:id/board
 * @desc Traveler marks as about to board
 * @access Private (Traveler only)
 */
router.post(
  '/:id/board',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Match ID is required',
        });
      }

      const mongoose = (await import('mongoose')).default;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid match ID',
        });
      }

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
          message: 'Invalid traveler ID',
        });
      }

      const match = await bookingService.boardMatch(travelerObjectId, id);

      if (!match) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Match not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Boarding confirmed successfully',
        data: {
          id: match._id,
          status: match.status,
        },
      });
    } catch (error) {
      console.error('Error processing boarding:', error);

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process boarding',
      });
    }
    return;
  }
);

export default router;
