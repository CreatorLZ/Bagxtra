import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Match, MatchStatus } from '../models/Match';
import { ShopperRequest } from '../models/ShopperRequest';
import { UserRepository } from '../services/repositoryImpl';

const userRepo = new UserRepository();

export interface OrderData {
  id: string; // Match ID
  amount: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
}

export interface OrdersResponse {
  accepted: OrderData[];
  pending: OrderData[];
  incoming: OrderData[];
  outgoing: OrderData[];
  completed: OrderData[];
  disputed: OrderData[];
}

/**
 * Get orders for the current user (shopper or traveler)
 * GET /api/orders
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const user = await userRepo.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
    }

    let orders: OrdersResponse;

    if (user.role === 'shopper') {
      orders = await getShopperOrders(userId);
    } else if (user.role === 'traveler') {
      orders = await getTravelerOrders(userId);
    } else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user role for orders',
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch orders',
    });
  }
  return;
};

/**
 * Get orders for a shopper
 */
async function getShopperOrders(shopperId: string): Promise<OrdersResponse> {
  const shopperObjectId = new mongoose.Types.ObjectId(shopperId);


  // Get shopper's requests to find related matches
  const requests = await ShopperRequest.find({ shopperId: shopperObjectId });
  const requestIds = requests.map(r => r._id);

  // Get all matches for shopper's requests
  const shopperMatches = await Match.find({
    requestId: { $in: requestIds }
  }).populate({
    path: 'requestId',
    populate: {
      path: 'bagItems',
      model: 'BagItem'
    }
  }).populate('tripId').populate('travelerId');

  const orders: OrdersResponse = {
    accepted: [],
    pending: [],
    incoming: [],
    outgoing: [],
    completed: [],
    disputed: []
  };

  for (const match of shopperMatches) {
    const request = match.requestId as any;
    const trip = match.tripId as any;
    const traveler = match.travelerId as any;

    if (!request || !trip || !traveler) continue;

    // Calculate total amount from bag items
    const totalAmount = request.bagItems?.reduce((sum: number, item: any) =>
      sum + (item.price * item.quantity), 0) || 0;

    const orderData: OrderData = {
      id: (match as any)._id.toString(),
      amount: `$${totalAmount.toFixed(2)}`,
      item: request.bagItems?.[0]?.productName || 'Unknown Item',
      details: getShopperOrderDetails(match),
      timing: null,
      additionalInfo: request.bagItems?.length > 1 ? `${request.bagItems.length} items` : null
    };

    // Categorize by match status
    switch (match.status) {
      case MatchStatus.Approved:
        orders.accepted.push(orderData);
        break;
      case MatchStatus.Pending:
        orders.pending.push(orderData);
        break;
      case MatchStatus.Completed:
        orders.completed.push(orderData);
        break;
      // Add other status mappings as needed
    }
  }

  return orders;
}

/**
 * Get orders for a traveler
 */
async function getTravelerOrders(travelerId: string): Promise<OrdersResponse> {
  const travelerObjectId = new mongoose.Types.ObjectId(travelerId);

  // Get all matches for this traveler with populated request and shopper info
  const matches = await Match.find({ travelerId: travelerObjectId })
    .populate({
      path: 'requestId',
      populate: [
        {
          path: 'shopperId',
          model: 'User'
        },
        {
          path: 'bagItems',
          model: 'BagItem'
        }
      ]
    })
    .populate('tripId');

  const orders: OrdersResponse = {
    accepted: [],
    pending: [],
    incoming: [],
    outgoing: [],
    completed: [],
    disputed: []
  };

  for (const match of matches) {
    const request = match.requestId as any;
    const trip = match.tripId as any;

    if (!request || !trip || !request.shopperId) continue;

    // Calculate total amount from bag items
    const totalAmount = request.bagItems?.reduce((sum: number, item: any) =>
      sum + (item.price * item.quantity), 0) || 0;

    const orderData: OrderData = {
      id: (match as any)._id.toString(),
      amount: `$${totalAmount.toFixed(2)}`,
      item: request.bagItems?.[0]?.productName || 'Unknown Item',
      details: getTravelerOrderDetails(match),
      timing: null,
      additionalInfo: request.bagItems?.length > 1 ? `${request.bagItems.length} items` : null
    };

    // Categorize by match status
    switch (match.status) {
      case MatchStatus.Approved:
        orders.accepted.push(orderData);
        break;
      case MatchStatus.Pending:
        orders.pending.push(orderData);
        break;
      case MatchStatus.Completed:
        orders.completed.push(orderData);
        break;
      // Add other status mappings as needed
    }
  }

  return orders;
}

/**
 * Get order details text for shopper view
 */
function getShopperOrderDetails(match: any): string {
  switch (match.status) {
    case MatchStatus.Approved:
      return 'Waiting for payment confirmation';
    case MatchStatus.Pending:
      return 'Waiting for traveler approval';
    case MatchStatus.Completed:
      return `Delivered ${new Date(match.updatedAt).toLocaleDateString()}`;
    default:
      return 'Processing';
  }
}

/**
 * Get order details text for traveler view
 */
function getTravelerOrderDetails(match: any): string {
  switch (match.status) {
    case MatchStatus.Approved:
      return 'Waiting for shopper payment';
    case MatchStatus.Pending:
      return 'New delivery request';
    case MatchStatus.Completed:
      return `Completed ${new Date(match.updatedAt).toLocaleDateString()}`;
    default:
      return 'Processing';
  }
}

/**
 * Get detailed order information
 * GET /api/orders/:id
 */
export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid order ID'
      });
    }

    // Find the match
    const match = await Match.findById(id)
      .populate({
        path: 'requestId',
        populate: [
          { path: 'shopperId', model: 'User' },
          { path: 'bagItems', model: 'BagItem' }
        ]
      })
      .populate('tripId')
      .populate('travelerId') as any; // Type assertion for populated fields

    if (!match) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found',
      });
    }

    // Check if user has access to this order (either shopper or traveler)
    const request = match.requestId as any;
    const isShopper = request.shopperId._id.toString() === userId;
    const isTraveler = match.travelerId._id.toString() === userId;

    if (!isShopper && !isTraveler) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this order',
      });
    }

    const trip = match.tripId as any;
    const traveler = match.travelerId as any;
    const shopper = request.shopperId as any;

    // Calculate duration
    const calculateDuration = (): string => {
      try {
        const depDateTime = new Date(`${trip.departureDate.toISOString().split('T')[0]}T${trip.departureTime}`);
        const arrDateTime = new Date(`${trip.arrivalDate.toISOString().split('T')[0]}T${trip.arrivalTime}`);
        const diffMs = arrDateTime.getTime() - depDateTime.getTime();
        if (diffMs < 0) return 'Invalid duration';
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h${minutes.toString().padStart(2, '0')}m`;
      } catch (error) {
        return 'Invalid duration';
      }
    };

    const response = {
      order: {
        id: match._id,
        status: match.status,
        matchScore: match.matchScore,
        createdAt: match.createdAt,
        priceSummary: request.priceSummary,
      },
      shopper: {
        id: shopper._id,
        name: shopper.fullName,
        avatar: shopper.profileImage,
        rating: shopper.rating || 0,
        phone: shopper.phone,
        country: shopper.country,
      },
      traveler: {
        id: traveler._id,
        name: traveler.fullName,
        avatar: traveler.profileImage,
        rating: traveler.rating || 0,
        phone: traveler.phone,
        country: traveler.country,
      },
      trip: {
        fromCountry: trip.fromCountry,
        toCountry: trip.toCountry,
        departureDate: trip.departureDate.toISOString().split('T')[0],
        departureTime: trip.departureTime,
        arrivalDate: trip.arrivalDate.toISOString().split('T')[0],
        arrivalTime: trip.arrivalTime,
        timezone: trip.timezone,
        availableCarryOnKg: trip.availableCarryOnKg,
        availableCheckedKg: trip.availableCheckedKg,
        duration: calculateDuration(),
      },
      products: request.bagItems.map((item: any) => ({
        name: item.productName,
        link: item.productLink,
        price: item.price,
        currency: item.currency,
        weight: item.weightKg,
        quantity: item.quantity,
        isFragile: item.isFragile,
        photos: item.photos || [],
        colour: item.colour,
        additionalInfo: item.additionalInfo,
      })),
      delivery: {
        fromCountry: request.fromCountry,
        toCountry: request.toCountry,
        startDate: request.deliveryStartDate?.toISOString().split('T')[0],
        endDate: request.deliveryEndDate?.toISOString().split('T')[0],
        pickup: request.pickup,
        carryOn: request.carryOn,
        storePickup: request.storePickup,
        phone: request.phone,
        phoneCountry: request.phoneCountry,
      },
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch order details',
    });
  }
  return;
};