import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Match, MatchStatus } from '../models/Match';
import { ShopperRequest } from '../models/ShopperRequest';
import { UserRepository } from '../services/repositoryImpl';

const userRepo = new UserRepository();

export interface OrderData {
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