import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validation.js';
import {
  createShopperRequest,
  getMyShopperRequests,
  getShopperRequest,
  publishShopperRequest,
  cancelShopperRequest,
} from '../controllers/shopperRequestController.js';
import { z } from 'zod';
import mongoose from 'mongoose';

// Common ID schema for validation
const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

const router = Router();

const createRequestSchema = z.object({
  destinationCountry: z.string().min(1).max(100),
  bagItems: z.array(z.object({
    productName: z.string().min(1).max(255),
    productLink: z.string().url(),
    price: z.number().positive(),
    currency: z.string().min(1).max(10),
    weightKg: z.number().positive(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    quantity: z.number().int().positive(),
    isFragile: z.boolean(),
    photos: z.array(z.string().url()).optional(),
    requiresSpecialDelivery: z.boolean().optional(),
    specialDeliveryCategory: z.string().optional(),
  })).min(1),
});

const cancelRequestSchema = z.object({
  reason: z.string().optional(),
});

/**
 * @route POST /api/shopper-requests
 * @desc Create a new shopper request
 * @access Private (Shopper only)
 */
router.post('/', requireAuth, authorizeRoles('shopper'), async (req, res) => {
  try {
    const requestData = createRequestSchema.parse(req.body);

    // Get shopper ID from auth middleware
    const shopperId = req.user?.id;
    if (!shopperId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Convert string ID to ObjectId
    const mongoose = (await import('mongoose')).default;
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shopper ID'
      });
    }

    // Import service here to avoid circular dependencies
    const { ShopperRequestService } = await import('../services/ShopperRequestService.js');
    const { ShopperRequestRepository, BagItemRepository, UserRepository } = await import('../services/repositoryImpl.js');
    const { BagService } = await import('../services/BagService.js');

    // Initialize repositories and services
    const shopperRequestRepo = new ShopperRequestRepository();
    const bagItemRepo = new BagItemRepository();
    const userRepo = new UserRepository();
    const bagService = new BagService(bagItemRepo, shopperRequestRepo);
    const shopperRequestService = new ShopperRequestService(
      shopperRequestRepo,
      bagItemRepo,
      userRepo,
      bagService
    );

    // Create the shopper request
    const shopperRequest = await shopperRequestService.createShopperRequest(
      shopperObjectId,
      requestData
    );

    res.status(201).json({
      success: true,
      message: 'Shopper request created successfully',
      data: {
        id: shopperRequest._id,
        destinationCountry: shopperRequest.destinationCountry,
        status: shopperRequest.status,
        priceSummary: shopperRequest.priceSummary,
        bagItemsCount: shopperRequest.bagItems.length,
        createdAt: shopperRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating shopper request:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create shopper request',
    });
  }
  return;
});

/**
 * @route GET /api/shopper-requests/my-requests
 * @desc Get current shopper's requests
 * @access Private (Shopper only)
 */
router.get('/my-requests', requireAuth, authorizeRoles('shopper'), async (req, res) => {
  try {
    // Get shopper ID from auth middleware
    const shopperId = req.user?.id;
    if (!shopperId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Convert string ID to ObjectId
    const mongoose = (await import('mongoose')).default;
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shopper ID'
      });
    }

    // Import service
    const { ShopperRequestService } = await import('../services/ShopperRequestService.js');
    const { ShopperRequestRepository, BagItemRepository, UserRepository } = await import('../services/repositoryImpl.js');
    const { BagService } = await import('../services/BagService.js');

    const shopperRequestRepo = new ShopperRequestRepository();
    const bagItemRepo = new BagItemRepository();
    const userRepo = new UserRepository();
    const bagService = new BagService(bagItemRepo, shopperRequestRepo);
    const shopperRequestService = new ShopperRequestService(
      shopperRequestRepo,
      bagItemRepo,
      userRepo,
      bagService
    );

    // Get shopper's requests
    const requests = await shopperRequestService.getShopperRequests(shopperObjectId);

    res.status(200).json({
      success: true,
      data: requests.map(request => ({
        id: request._id,
        destinationCountry: request.destinationCountry,
        status: request.status,
        priceSummary: request.priceSummary,
        paymentStatus: request.paymentStatus,
        bagItemsCount: request.bagItems.length,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching shopper requests:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch shopper requests',
    });
  }
  return;
});

/**
 * @route GET /api/shopper-requests/:id
 * @desc Get specific shopper request details
 * @access Private (Shopper only - own requests)
 */
router.get('/:id', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request ID'
      });
    }

    // Import service
    const { ShopperRequestService } = await import('../services/ShopperRequestService.js');
    const { ShopperRequestRepository, BagItemRepository, UserRepository } = await import('../services/repositoryImpl.js');
    const { BagService } = await import('../services/BagService.js');

    const shopperRequestRepo = new ShopperRequestRepository();
    const bagItemRepo = new BagItemRepository();
    const userRepo = new UserRepository();
    const bagService = new BagService(bagItemRepo, shopperRequestRepo);
    const shopperRequestService = new ShopperRequestService(
      shopperRequestRepo,
      bagItemRepo,
      userRepo,
      bagService
    );

    const requestId = new mongoose.Types.ObjectId(id);
    const request = await shopperRequestService.getShopperRequest(requestId);

    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
      });
    }

    // Check ownership (shopper can only see their own requests)
    const shopperId = req.user?.id;
    if (request.shopperId.toString() !== shopperId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own requests',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: request._id,
        shopperId: request.shopperId,
        destinationCountry: request.destinationCountry,
        status: request.status,
        priceSummary: request.priceSummary,
        paymentStatus: request.paymentStatus,
        bagItems: request.bagItems,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching shopper request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch shopper request',
    });
  }
  return;
});

/**
 * @route PUT /api/shopper-requests/:id/publish
 * @desc Publish a draft shopper request (make it available for matching)
 * @access Private (Shopper only - own requests)
 */
router.put('/:id/publish', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const mongoose = (await import('mongoose')).default;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request ID'
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

    let requestObjectId: mongoose.Types.ObjectId;
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      requestObjectId = new mongoose.Types.ObjectId(id);
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID'
      });
    }

    // Import service
    const { ShopperRequestService } = await import('../services/ShopperRequestService.js');
    const { ShopperRequestRepository, BagItemRepository, UserRepository } = await import('../services/repositoryImpl.js');
    const { BagService } = await import('../services/BagService.js');

    const shopperRequestRepo = new ShopperRequestRepository();
    const bagItemRepo = new BagItemRepository();
    const userRepo = new UserRepository();
    const bagService = new BagService(bagItemRepo, shopperRequestRepo);
    const shopperRequestService = new ShopperRequestService(
      shopperRequestRepo,
      bagItemRepo,
      userRepo,
      bagService
    );

    const updatedRequest = await shopperRequestService.publishShopperRequest(
      requestObjectId,
      shopperObjectId
    );

    if (!updatedRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shopper request published successfully',
      data: {
        id: updatedRequest._id,
        status: updatedRequest.status,
      },
    });
  } catch (error) {
    console.error('Error publishing shopper request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to publish shopper request',
    });
  }
  return;
});

/**
 * @route PUT /api/shopper-requests/:id/cancel
 * @desc Cancel a shopper request
 * @access Private (Shopper only - own requests)
 */
router.put('/:id/cancel', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = cancelRequestSchema.parse(req.body);

    const mongoose = (await import('mongoose')).default;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request ID'
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

    let requestObjectId: mongoose.Types.ObjectId;
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      requestObjectId = new mongoose.Types.ObjectId(id);
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID'
      });
    }

    // Import service
    const { ShopperRequestService } = await import('../services/ShopperRequestService.js');
    const { ShopperRequestRepository, BagItemRepository, UserRepository } = await import('../services/repositoryImpl.js');
    const { BagService } = await import('../services/BagService.js');

    const shopperRequestRepo = new ShopperRequestRepository();
    const bagItemRepo = new BagItemRepository();
    const userRepo = new UserRepository();
    const bagService = new BagService(bagItemRepo, shopperRequestRepo);
    const shopperRequestService = new ShopperRequestService(
      shopperRequestRepo,
      bagItemRepo,
      userRepo,
      bagService
    );

    const updatedRequest = await shopperRequestService.cancelShopperRequest(
      requestObjectId,
      shopperObjectId,
      reason
    );

    if (!updatedRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shopper request cancelled successfully',
      data: {
        id: updatedRequest._id,
        status: updatedRequest.status,
      },
    });
  } catch (error) {
    console.error('Error cancelling shopper request:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel shopper request',
    });
  }
  return;
});

export default router;