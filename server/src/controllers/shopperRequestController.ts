import { Request, Response } from 'express';
import { ShopperRequestService } from '../services/ShopperRequestService';
import { ShopperRequestRepository } from '../services/repositoryImpl';
import { BagItemRepository } from '../services/repositoryImpl';
import { UserRepository } from '../services/repositoryImpl';
import { BagService } from '../services/BagService';
import mongoose from 'mongoose';
import { z } from 'zod';

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

/**
 * Create a new shopper request
 * POST /api/shopper-requests
 */
export const createShopperRequest = async (req: Request, res: Response) => {
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
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shopper ID'
      });
    }

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
};

/**
 * Get shopper's requests
 * GET /api/shopper-requests/my-requests
 */
export const getMyShopperRequests = async (req: Request, res: Response) => {
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
    let shopperObjectId: mongoose.Types.ObjectId;
    try {
      shopperObjectId = new mongoose.Types.ObjectId(shopperId);
    } catch {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shopper ID'
      });
    }

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
};

/**
 * Get specific shopper request
 * GET /api/shopper-requests/:id
 */
export const getShopperRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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

    const request = await shopperRequestService.getShopperRequest(requestObjectId, shopperObjectId);

    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
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
    if (error instanceof Error && error.message === 'Unauthorized to access this request') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own requests',
      });
    }

    console.error('Error fetching shopper request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch shopper request',
    });
  }
  return;
};

/**
 * Publish a draft shopper request
 * PUT /api/shopper-requests/:id/publish
 */
export const publishShopperRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
};

/**
 * Cancel a shopper request
 * PUT /api/shopper-requests/:id/cancel
 */
export const cancelShopperRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

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
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel shopper request',
    });
  }
  return;
};