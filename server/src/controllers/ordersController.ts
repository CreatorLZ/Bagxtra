import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Match, MatchStatus } from '../models/Match';
import { ShopperRequest } from '../models/ShopperRequest';
import { UserRepository } from '../services/repositoryImpl';
import { formatTimeAgo } from '../utils/dateUtils';

const userRepo = new UserRepository();

export interface OrderData {
  id: string; // Match ID
  amount: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
  shopperName?: string; // For traveler view
  shopperAvatar?: string; // For traveler view
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
    requestId: { $in: requestIds },
  })
    .populate({
      path: 'requestId',
      populate: {
        path: 'bagItems',
        model: 'BagItem',
      },
    })
    .populate('tripId')
    .populate('travelerId');

  const orders: OrdersResponse = {
    accepted: [],
    pending: [],
    incoming: [],
    outgoing: [],
    completed: [],
    disputed: [],
  };

  // Track which requests have matches to avoid duplicates
  const matchedRequestIds = new Set<string>();

  for (const match of shopperMatches) {
    const request = match.requestId as any;
    const trip = match.tripId as any;
    const traveler = match.travelerId as any;

    if (!request || !trip || !traveler) continue;

    // Mark this request as having a match
    matchedRequestIds.add(request._id.toString());

    // Calculate total amount from bag items
    const totalAmount =
      request.bagItems?.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ) || 0;

    const orderData: OrderData = {
      id: (match as any)._id.toString(),
      amount: `$${totalAmount.toFixed(2)}`,
      item: request.bagItems?.[0]?.productName || 'Unknown Item',
      details: getShopperOrderDetails(match),
      timing:
        match.status === MatchStatus.Pending
          ? formatTimeAgo(match.createdAt)
          : null,
      additionalInfo:
        request.bagItems?.length > 1
          ? `${request.bagItems.length} items`
          : null,
    };

    // Categorize by match status
    switch (match.status) {
      case 'approved':
        orders.accepted.push(orderData);
        break;
      case 'paid':
      case 'item_purchased':
      case 'boarding':
        orders.incoming.push(orderData);
        break;
      case 'pending':
      case 'claimed':
        orders.pending.push(orderData);
        break;
      case 'completed':
        orders.completed.push(orderData);
        break;
      case 'rejected':
        // Rejected orders don't appear in active lists
        break;
    }
  }

  // Add marketplace requests that don't have matches yet
  const marketplaceRequests = await ShopperRequest.find({
    shopperId: shopperObjectId,
    status: 'marketplace',
  }).populate('bagItems');

  for (const request of marketplaceRequests) {
    // Skip if this request already has a match
    if (matchedRequestIds.has(request._id.toString())) continue;

    const req = request as any; // Cast to any to access populated bagItems
    const totalAmount =
      req.bagItems?.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ) || 0;

    const orderData: OrderData = {
      id: request._id.toString(),
      amount: `$${totalAmount.toFixed(2)}`,
      item: req.bagItems?.[0]?.productName || 'Unknown Item',
      details: 'Sent a delivery proposal',
      timing: formatTimeAgo(request.createdAt),
      additionalInfo:
        req.bagItems?.length > 1 ? `${req.bagItems.length} items` : null,
    };

    // Marketplace orders go to pending
    orders.pending.push(orderData);
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
          model: 'User',
        },
        {
          path: 'bagItems',
          model: 'BagItem',
        },
      ],
    })
    .populate('tripId');

  const orders: OrdersResponse = {
    accepted: [],
    pending: [],
    incoming: [],
    outgoing: [],
    completed: [],
    disputed: [],
  };

  for (const match of matches) {
    const request = match.requestId as any;
    const trip = match.tripId as any;

    if (!request || !trip || !request.shopperId) continue;

    // Calculate total amount from bag items
    const totalAmount =
      request.bagItems?.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ) || 0;

    const orderData: OrderData = {
      id: (match as any)._id.toString(),
      amount: `$${totalAmount.toFixed(2)}`,
      item: request.bagItems?.[0]?.productName || 'Unknown Item',
      details: getTravelerOrderDetails(match),
      timing:
        match.status === MatchStatus.Pending
          ? formatTimeAgo(match.createdAt)
          : null,
      additionalInfo:
        request.bagItems?.length > 1
          ? `${request.bagItems.length} items`
          : null,
      shopperName: request.shopperId?.fullName || 'Unknown Shopper',
      shopperAvatar: request.shopperId?.profileImage || null,
    };

    // Categorize by match status
    switch (match.status) {
      case 'approved':
        orders.accepted.push(orderData);
        break;
      case 'paid':
      case 'item_purchased':
      case 'boarding':
        orders.outgoing.push(orderData);
        break;
      case 'pending':
      case 'claimed':
        orders.pending.push(orderData);
        break;
      case 'completed':
        orders.completed.push(orderData);
        break;
      case 'rejected':
        // Rejected orders don't appear in active lists
        break;
    }
  }

  return orders;
}

/**
 * Get order details text for shopper view
 */
function getShopperOrderDetails(match: any): string {
  switch (match.status) {
    case 'approved':
      return 'Waiting for payment confirmation';
    case 'paid':
      return 'Payment confirmed - traveler purchasing items';
    case 'item_purchased':
      return 'Item purchased - awaiting delivery';
    case 'pending':
      return 'Waiting for traveler approval';
    case 'completed':
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
    case 'approved':
      return 'Waiting for shopper payment';
    case 'paid':
      return 'Payment received - purchase items';
    case 'item_purchased':
      return 'Awaiting delivery';
    case 'boarding':
      return 'Boarding flight';
    case 'pending':
      return 'New delivery request';
    case 'completed':
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
        message: 'Invalid order ID',
      });
    }

    // First try to find a match (existing orders)
    let match = (await Match.findById(id)
      .populate({
        path: 'requestId',
        populate: [
          { path: 'shopperId', model: 'User' },
          { path: 'bagItems', model: 'BagItem' },
        ],
      })
      .populate('tripId')
      .populate('travelerId')) as any;

    let isMarketplaceOrder = false;
    let marketplaceRequest = null;

    // If no match found, try to find a marketplace shopper request
    if (!match) {
      marketplaceRequest = (await ShopperRequest.findById(id)
        .populate('shopperId', 'fullName profileImage rating phone country')
        .populate('bagItems')) as any;

      if (marketplaceRequest && marketplaceRequest.status === 'marketplace') {
        isMarketplaceOrder = true;
      } else {
        return res.status(404).json({
          error: 'Not found',
          message: 'Order not found',
        });
      }
    }

    let request: any;
    let shopper: any;
    let traveler: any = null;
    let trip: any = null;

    if (isMarketplaceOrder) {
      // For marketplace orders, travelers or the owning shopper can view them
      request = marketplaceRequest;
      shopper = request.shopperId;

      const user = await userRepo.findById(new mongoose.Types.ObjectId(userId));
      const isTraveler = user?.role === 'traveler';
      const isOwningShopper = shopper._id.toString() === userId;

      if (!isTraveler && !isOwningShopper) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this marketplace order',
        });
      }
    } else {
      // For existing matches, check access control
      request = match.requestId as any;

      // Guards to ensure populated fields exist before accessing _id
      if (!request) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Request data is missing',
        });
      }
      if (!request.shopperId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Shopper information is missing',
        });
      }
      if (!match.travelerId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Traveler information is missing',
        });
      }

      const isShopper = request.shopperId._id.toString() === userId;
      const isTraveler = match.travelerId._id.toString() === userId;

      if (!isShopper && !isTraveler) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this order',
        });
      }

      shopper = request.shopperId;
      traveler = match.travelerId;
      trip = match.tripId;
    }

    // Variables already declared above

    // Validate required objects for non-marketplace orders
    if (!isMarketplaceOrder) {
      if (
        !trip ||
        !shopper ||
        !traveler ||
        !trip.departureDate ||
        !trip.arrivalDate ||
        !shopper._id
      ) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Order data incomplete' });
      }
    } else {
      // For marketplace orders, only shopper is required
      if (!shopper || !shopper._id) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Shopper data incomplete' });
      }
    }

    // Calculate duration (only for non-marketplace orders)
    const calculateDuration = (): string => {
      if (!trip) return 'N/A';
      try {
        const depDateTime = new Date(
          `${trip.departureDate.toISOString().split('T')[0]}T${
            trip.departureTime
          }`
        );
        const arrDateTime = new Date(
          `${trip.arrivalDate.toISOString().split('T')[0]}T${trip.arrivalTime}`
        );
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
        id: isMarketplaceOrder ? request._id : match._id,
        status: isMarketplaceOrder ? 'marketplace' : match.status,
        matchScore: isMarketplaceOrder ? 0 : match.matchScore,
        createdAt: isMarketplaceOrder ? request.createdAt : match.createdAt,
        priceSummary: request.priceSummary,
        receiptUrl: isMarketplaceOrder ? null : match.receiptUrl,
      },
      shopper: {
        id: shopper._id,
        name: shopper.fullName,
        avatar: shopper.profileImage,
        rating: shopper.rating || 0,
        phone: shopper.phone,
        country: shopper.country,
      },
      traveler: isMarketplaceOrder
        ? null
        : {
            id: traveler._id,
            name: traveler.fullName,
            avatar: traveler.profileImage,
            rating: traveler.rating || 0,
            phone: traveler.phone,
            country: traveler.country,
          },
      trip: isMarketplaceOrder
        ? null
        : {
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
      products: (Array.isArray(request.bagItems) ? request.bagItems : []).map(
        (item: any) => ({
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
        })
      ),
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
