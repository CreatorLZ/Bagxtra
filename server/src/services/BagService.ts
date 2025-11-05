import { IBagItem } from '../models/BagItem';
import { IShopperRequest } from '../models/ShopperRequest';
import { IBagItemRepository, IShopperRequestRepository } from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const createBagItemSchema = z.object({
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
});

const updateBagItemSchema = createBagItemSchema.partial();

export class BagService {
  constructor(
    private bagItemRepo: IBagItemRepository,
    private shopperRequestRepo: IShopperRequestRepository
  ) {}

  async createBagItem(
    bagItemData: z.infer<typeof createBagItemSchema>
  ): Promise<IBagItem> {
    const validatedData = createBagItemSchema.parse(bagItemData);
    return await this.bagItemRepo.create(validatedData as any);
  }

  async updateBagItem(
    id: mongoose.Types.ObjectId,
    updates: z.infer<typeof updateBagItemSchema>
  ): Promise<IBagItem | null> {
    const validatedUpdates = updateBagItemSchema.parse(updates);
    return await this.bagItemRepo.update(id, validatedUpdates as any);
  }

  async deleteBagItem(id: mongoose.Types.ObjectId): Promise<boolean> {
    return await this.bagItemRepo.delete(id);
  }

  async getBagItem(id: mongoose.Types.ObjectId): Promise<IBagItem | null> {
    return await this.bagItemRepo.findById(id);
  }

  async getBagItemsByRequest(
    requestId: mongoose.Types.ObjectId
  ): Promise<IBagItem[]> {
    return await this.bagItemRepo.findByShopperRequest(requestId);
  }

  async calculateBagTotals(
    bagItems: IBagItem[]
  ): Promise<{ totalWeight: number; totalValue: number; isFragile: boolean }> {
    let totalWeight = 0;
    let totalValue = 0;
    let isFragile = false;

    for (const item of bagItems) {
      totalWeight += item.weightKg * item.quantity;
      totalValue += item.price * item.quantity;
      if (item.isFragile) isFragile = true;
    }

    return { totalWeight, totalValue, isFragile };
  }

  async validateBagConstraints(
    bagItems: IBagItem[],
    maxWeight?: number,
    maxValue?: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const { totalWeight, totalValue } = await this.calculateBagTotals(bagItems);

    if (maxWeight && totalWeight > maxWeight) {
      errors.push(
        `Total weight ${totalWeight}kg exceeds maximum ${maxWeight}kg`
      );
    }

    if (maxValue && totalValue > maxValue) {
      errors.push(`Total value ${totalValue} exceeds maximum ${maxValue}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async decideBagAssignment(
    shopperId: mongoose.Types.ObjectId,
    newItems: IBagItem[],
    existingRequest?: IShopperRequest
  ): Promise<{
    shouldCreateNew: boolean;
    requestId?: mongoose.Types.ObjectId;
  }> {
    if (!existingRequest) {
      return { shouldCreateNew: true };
    }

    const existingItems = await this.getBagItemsByRequest(existingRequest._id);
    const combinedItems = [...existingItems, ...newItems];

    const validation = await this.validateBagConstraints(combinedItems);
    if (!validation.valid) {
      return { shouldCreateNew: true };
    }

    return { shouldCreateNew: false, requestId: existingRequest._id };
  }
}
