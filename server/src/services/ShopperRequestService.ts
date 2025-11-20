import { IShopperRequest, IPriceSummary } from '../models/ShopperRequest';
import { IBagItem } from '../models/BagItem';
import { IUser } from '../models/User';
import {
  IShopperRequestRepository,
  IBagItemRepository,
  IUserRepository
} from './repositories';
import { BagService } from './BagService';
import { BUSINESS_RULES } from '../config/businessRules';
import mongoose from 'mongoose';
import { z } from 'zod';

const createShopperRequestSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  toCountry: z.string().min(1).max(100),
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

// Using BUSINESS_RULES from config instead of hardcoded values

export class ShopperRequestService {
  constructor(
    private shopperRequestRepo: IShopperRequestRepository,
    private bagItemRepo: IBagItemRepository,
    private userRepo: IUserRepository,
    private bagService: BagService
  ) {}

  /**
   * Create a new shopper request with bag items
   */
  async createShopperRequest(
    shopperId: mongoose.Types.ObjectId,
    requestData: z.infer<typeof createShopperRequestSchema>
  ): Promise<IShopperRequest> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const validatedData = createShopperRequestSchema.parse(requestData);

      // Validate shopper exists and is a shopper
      const shopper = await this.userRepo.findById(shopperId);
      if (!shopper) {
        throw new Error('Shopper not found');
      }
      if (shopper.role !== 'shopper') {
        throw new Error('User is not a shopper');
      }

      // Create bag items first
      const bagItems: IBagItem[] = [];
      const bagItemIds: mongoose.Types.ObjectId[] = [];
      for (const itemData of validatedData.bagItems) {
        const bagItem = await this.bagService.createBagItem(itemData, session);
        bagItems.push(bagItem);
        bagItemIds.push(bagItem._id);
      }

      const priceSummary = await this.calculatePriceSummary(bagItems);

      // Create shopper request
      const requestDataToCreate: any = {
        shopperId,
        bagItems: bagItemIds,
        fromCountry: validatedData.fromCountry,
        toCountry: validatedData.toCountry,
        status: 'draft' as const,
        priceSummary,
        paymentStatus: 'pending' as const,
      };

      // Add delivery dates if provided
      if (validatedData.deliveryStartDate) {
        requestDataToCreate.deliveryStartDate = new Date(validatedData.deliveryStartDate);
      }
      if (validatedData.deliveryEndDate) {
        requestDataToCreate.deliveryEndDate = new Date(validatedData.deliveryEndDate);
      }

      const shopperRequest = await this.shopperRequestRepo.create(requestDataToCreate, session);

      await session.commitTransaction();
      return shopperRequest;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get shopper request by ID with ownership verification
   */
  async getShopperRequest(
    requestId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId
  ): Promise<IShopperRequest | null> {
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      return null;
    }
    if (!request.shopperId.equals(shopperId)) {
      throw new Error('Unauthorized to access this request');
    }
    return request;
  }

  /**
   * Get all requests for a shopper
   */
  async getShopperRequests(
    shopperId: mongoose.Types.ObjectId
  ): Promise<IShopperRequest[]> {
    return await this.shopperRequestRepo.findByShopper(shopperId);
  }

  /**
   * Publish a draft request (make it open for matching)
   */
  async publishShopperRequest(
    requestId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId
  ): Promise<IShopperRequest | null> {
    // Verify ownership
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }
    if (!request.shopperId.equals(shopperId)) {
      throw new Error('Unauthorized to publish this request');
    }

    if (request.status !== 'draft') {
      throw new Error('Only draft requests can be published');
    }

    // Validate request has items
    if (request.bagItems.length === 0) {
      throw new Error('Cannot publish request without bag items');
    }

    return await this.shopperRequestRepo.update(requestId, {
      status: 'open',
    });
  }

  /**
   * Cancel a shopper request
   */
  async cancelShopperRequest(
    requestId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<IShopperRequest | null> {
    // Verify ownership
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }
    if (!request.shopperId.equals(shopperId)) {
      throw new Error('Unauthorized to cancel this request');
    }

    // Cannot cancel if matched or in progress
    if (['matched', 'purchase_pending', 'purchased', 'in_transit'].includes(request.status)) {
      throw new Error('Cannot cancel request that is already in progress');
    }

    const updateData: Partial<IShopperRequest> = {
      status: 'cancelled',
    };

    if (reason) {
      updateData.cancellationReason = reason;
    }

    return await this.shopperRequestRepo.update(requestId, updateData);
  }

  /**
   * Calculate price summary for bag items
   */
  private async calculatePriceSummary(bagItems: IBagItem[]): Promise<IPriceSummary> {
    const { totalValue } = await this.bagService.calculateBagTotals(bagItems);

    const deliveryFee = BUSINESS_RULES.pricing.deliveryFee;
    const serviceFee = BUSINESS_RULES.pricing.serviceFee;
    const subtotal = totalValue + deliveryFee + serviceFee;
    const tax = subtotal * BUSINESS_RULES.pricing.taxRate;

    return {
      totalItemCost: totalValue,
      deliveryFee,
      serviceFee,
      tax,
    };
  }

  /**
   * Get open requests for matching
   */
  async getOpenRequests(): Promise<IShopperRequest[]> {
    return await this.shopperRequestRepo.findOpenRequests();
  }
}