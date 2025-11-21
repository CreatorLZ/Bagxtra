import { Request, Response } from 'express';
import { ShopperRequestService } from '../services/ShopperRequestService';
import { ShopperRequestRepository } from '../services/repositoryImpl';
import { BagItemRepository } from '../services/repositoryImpl';
import { UserRepository } from '../services/repositoryImpl';
import { TripRepository } from '../services/repositoryImpl';
import { MatchRepository } from '../services/repositoryImpl';
import { BagService } from '../services/BagService';
import { MatchingService } from '../services/MatchingService';
import { MatchService } from '../services/MatchService';
import mongoose from 'mongoose';
import { z } from 'zod';
import { format } from 'date-fns';

const createRequestSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  destinationCountry: z.string().min(1).max(100), // Changed to match client payload
  deliveryStartDate: z.string().optional(),
  deliveryEndDate: z.string().optional(),
  bagItems: z.array(z.object({
    productName: z.string().min(1).max(255),
    productLink: z.string().url(),
    price: z.number().positive(),
    currency: z.string().min(1).max(10),
    weightKg: z.number().positive(),
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
const tripRepo = new TripRepository();
const matchRepo = new MatchRepository();
const bagService = new BagService(bagItemRepo, shopperRequestRepo);
const matchingService = new MatchingService(tripRepo, userRepo);
const matchService = new MatchService(matchRepo, shopperRequestRepo, tripRepo, bagItemRepo);
const shopperRequestService = new ShopperRequestService(
  shopperRequestRepo,
  bagItemRepo,
  userRepo,
  bagService
);

// Helper functions for country extraction
function extractFromCountry(fromCountry: string): string {
  if (!fromCountry) return 'US'; // Default fallback

  // Try to extract country from location string
  // Format: "City, Country" or just "Country"
  const parts = fromCountry.split(',').map(part => part.trim());
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length > 0) {
      return lastPart; // Last part is usually the country
    }
  }

  return fromCountry.trim();
}

function extractToCountry(toCountry: string): string {
  return extractFromCountry(toCountry); // Same logic
}

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

    // Map destinationCountry to toCountry for service compatibility
    const serviceRequestData = {
      ...requestData,
      toCountry: requestData.destinationCountry,
    };
    delete (serviceRequestData as any).destinationCountry;

    // Create the shopper request
    const shopperRequest = await shopperRequestService.createShopperRequest(
      shopperObjectId,
      serviceRequestData
    );

    res.status(201).json({
      success: true,
      message: 'Shopper request created successfully',
      data: {
        id: shopperRequest._id,
        fromCountry: shopperRequest.fromCountry,
        toCountry: shopperRequest.toCountry,
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
        fromCountry: request.fromCountry,
        toCountry: request.toCountry,
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
        fromCountry: request.fromCountry,
        toCountry: request.toCountry,
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
    const { status } = req.body; // Optional status override (e.g., 'marketplace')

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
      shopperObjectId,
      status // Pass the status if provided
    );

    if (!updatedRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
      });
    }

    // Automatically find and create matches for the published request
    try {
      const bagItems = await bagItemRepo.findByShopperRequest(requestObjectId);
      if (bagItems && bagItems.length > 0) {
        const matches = await matchingService.findMatches(bagItems, {
          fromCountry: extractFromCountry(updatedRequest.fromCountry),
          toCountry: extractToCountry(updatedRequest.toCountry),
          deliveryStartDate: updatedRequest.deliveryStartDate ? new Date(updatedRequest.deliveryStartDate) : undefined,
          deliveryEndDate: updatedRequest.deliveryEndDate ? new Date(updatedRequest.deliveryEndDate) : undefined,
        });

        // Create Match records asynchronously
        const matchPromises = matches.map(async (match: any) => {
          // Check if match already exists to avoid duplicates
          const existingMatches = await matchRepo.findByRequest(requestObjectId);
          const existingMatch = existingMatches.find(m => m.tripId.equals(match.trip._id));

          if (!existingMatch) {
            await matchService.createMatch(
              requestObjectId,
              match.trip._id,
              match.score,
              [] // No assigned items initially
            );
          }
        });

        // Execute match creation in background (don't await to avoid blocking response)
        Promise.all(matchPromises).catch(error => {
          console.error('Error creating matches for published request:', error);
        });
      }
    } catch (error) {
      // Log error but don't fail the publish operation
      console.error('Error during automatic matching:', error);
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
 * Find potential matches without creating database records
 * POST /api/shopper-requests/find-matches
 */
export const findPotentialMatches = async (req: Request, res: Response) => {
  try {
    const requestData = z.object({
      fromCountry: z.string().min(1).max(100),
      toCountry: z.string().min(1).max(100),
      deliveryStartDate: z.string().optional(),
      deliveryEndDate: z.string().optional(),
      bagItems: z.array(z.object({
        productName: z.string().min(1).max(255),
        productLink: z.string().url().optional(),
        price: z.number().positive(),
        currency: z.string().min(1).max(10),
        weightKg: z.number().positive(),
        quantity: z.number().int().positive(),
        isFragile: z.boolean(),
        photos: z.array(z.string().url()).optional(),
        requiresSpecialDelivery: z.boolean().optional(),
        specialDeliveryCategory: z.string().optional(),
      })).min(1),
    }).parse(req.body);

    // Convert plain bag items to format expected by matching service
    const convertedBagItems = requestData.bagItems.map(item => ({
      weightKg: item.weightKg,
      quantity: item.quantity,
      price: item.price,
      isFragile: item.isFragile,
      requiresSpecialDelivery: item.requiresSpecialDelivery || false,
      specialDeliveryCategory: item.specialDeliveryCategory || undefined,
    })) as any; // Type assertion for matching service compatibility

    // Run matching algorithm without creating database records
    const matches = await matchingService.findMatches(convertedBagItems, {
      fromCountry: requestData.fromCountry,
      toCountry: requestData.toCountry,
      deliveryStartDate: requestData.deliveryStartDate ? new Date(requestData.deliveryStartDate) : undefined,
      deliveryEndDate: requestData.deliveryEndDate ? new Date(requestData.deliveryEndDate) : undefined,
    });

    // Format response with traveler and trip details (similar to getShopperRequestMatches)
    const formattedMatches = await Promise.all(
      matches.map(async (match: any) => {
        const trip = await tripRepo.findById(match.trip._id);
        const traveler = await userRepo.findById(match.trip.travelerId);

        if (!trip || !traveler) {
          return null;
        }

        return {
          _id: `temp_${match.trip._id}`, // Temporary ID for frontend
          matchScore: match.score,
          travelerName: traveler.fullName,
          travelerAvatar: traveler.profileImage || null,
          travelerRating: traveler.rating || 0,
          flightDetails: {
            from: trip.fromCountry,
            to: trip.toCountry,
            departureDate: format(trip.departureDate, 'MM/dd/yy'),
            departureTime: trip.departureTime,
            arrivalDate: format(trip.arrivalDate, 'MM/dd/yy'),
            arrivalTime: trip.arrivalTime,
            timezone: trip.timezone,
            airline: 'Delta', // TODO: Add to trip model
          },
          capacityFit: {
            fitsCarryOn: match.capacityFit.fitsCarryOn || false,
            availableCarryOnKg: trip.availableCarryOnKg,
            availableCheckedKg: trip.availableCheckedKg,
          },
          rationale: match.rationale || [],
        };
      })
    );

    // Filter out null matches and sort by score
    const validMatches = formattedMatches.filter((match: any) => match !== null);
    validMatches.sort((a: any, b: any) => (b?.matchScore || 0) - (a?.matchScore || 0));

    res.status(200).json({
      success: true,
      data: validMatches,
    });
  } catch (error) {
    console.error('Error finding potential matches:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find matches',
    });
  }
  return;
};

/**
 * Get matches for a shopper request
 * GET /api/shopper-requests/:id/matches
 */
export const getShopperRequestMatches = async (req: Request, res: Response) => {
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

    // Verify request ownership
    const request = await shopperRequestService.getShopperRequest(requestObjectId, shopperObjectId);
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Shopper request not found',
      });
    }

    // Get bag items for matching
    const bagItems = await bagItemRepo.findByShopperRequest(requestObjectId);
    if (!bagItems || bagItems.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No bag items found for this request',
      });
    }

    // Find matches using MatchingService
    const matches = await matchingService.findMatches(bagItems, {
      fromCountry: extractFromCountry(request.fromCountry),
      toCountry: extractToCountry(request.toCountry),
      deliveryStartDate: request.deliveryStartDate ? new Date(request.deliveryStartDate) : undefined,
      deliveryEndDate: request.deliveryEndDate ? new Date(request.deliveryEndDate) : undefined,
    });

    // Create Match records if they don't exist
    const matchPromises = matches.map(async (match: any) => {
      // Check if match already exists by finding all matches for this request and filtering
      const existingMatches = await matchRepo.findByRequest(requestObjectId);
      const existingMatch = existingMatches.find(m => m.tripId.equals(match.trip._id));

      if (existingMatch) {
        return existingMatch;
      }

      // Create new match
      return await matchService.createMatch(
        requestObjectId,
        match.trip._id,
        match.score,
        [] // No assigned items initially
      );
    });

    const matchRecords = await Promise.all(matchPromises);

    // Format response with traveler and trip details
    const formattedMatches = await Promise.all(
      matchRecords.map(async (matchRecord: any) => {
        const trip = await tripRepo.findById(matchRecord.tripId);
        const traveler = await userRepo.findById(matchRecord.travelerId);

        if (!trip || !traveler) {
          return null;
        }

        // Find corresponding match result for rationale
        const matchResult = matches.find((m: any) => m.trip._id.equals(trip._id));

        return {
          _id: matchRecord._id,
          matchScore: matchRecord.matchScore,
          travelerName: traveler.fullName,
          travelerAvatar: traveler.profileImage || null,
          travelerRating: traveler.rating || 0,
          flightDetails: {
            from: trip.fromCountry,
            to: trip.toCountry,
            departureDate: format(trip.departureDate, 'MM/dd/yy'),
            departureTime: trip.departureTime,
            arrivalDate: format(trip.arrivalDate, 'MM/dd/yy'),
            arrivalTime: trip.arrivalTime,
            timezone: trip.timezone,
            airline: 'Delta', // TODO: Add to trip model
          },
          capacityFit: {
            fitsCarryOn: matchResult?.capacityFit.fitsCarryOn || false,
            availableCarryOnKg: trip.availableCarryOnKg,
            availableCheckedKg: trip.availableCheckedKg,
          },
          rationale: matchResult?.rationale || [],
        };
      })
    );

    // Filter out null matches and sort by score
    const validMatches = formattedMatches.filter((match: any) => match !== null);
    validMatches.sort((a: any, b: any) => (b?.matchScore || 0) - (a?.matchScore || 0));

    res.status(200).json({
      success: true,
      data: validMatches,
    });
  } catch (error) {
    console.error('Error fetching shopper request matches:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch matches',
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