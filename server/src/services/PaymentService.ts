import { IShopperRequest } from '../models/ShopperRequest';
import { IShopperRequestRepository } from './repositories';
import mongoose from 'mongoose';

export class PaymentService {
  private readonly CANCELLATION_FEE_WINDOW_HOURS = 24;

  constructor(private shopperRequestRepo: IShopperRequestRepository) {}

  async canCancelWithoutFee(
    requestId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Check if request is within 24-hour window of creation
    const now = new Date();
    const timeDiff = now.getTime() - request.createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff <= this.CANCELLATION_FEE_WINDOW_HOURS;
  }

  async processCancellation(
    requestId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<{ canCancel: boolean; fee: number; reason: string }> {
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify ownership
    if (!request.shopperId.equals(userId)) {
      throw new Error('Unauthorized to cancel this request');
    }

    const canCancelWithoutFee = await this.canCancelWithoutFee(requestId);

    if (canCancelWithoutFee) {
      return {
        canCancel: true,
        fee: 0,
        reason: 'Within 24-hour cancellation window',
      };
    }

    // Calculate cancellation fee (placeholder - would need business logic)
    const fee = this.calculateCancellationFee(request);

    return {
      canCancel: true,
      fee,
      reason: 'Outside 24-hour window, cancellation fee applies',
    };
  }

  private calculateCancellationFee(request: IShopperRequest): number {
    // Placeholder implementation - would need actual business rules
    // For example: percentage of total value or fixed fee based on request status
    const baseFee = 10; // $10 base fee
    return baseFee;
  }

  async processPayment(
    requestId: mongoose.Types.ObjectId,
    paymentMethod: string,
    amount: number
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Placeholder for payment processing
    // In Phase 4, this would integrate with actual payment processor (Stripe, PayPal, etc.)

    try {
      // Simulate payment processing
      const transactionId = `txn_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Update request payment status
      await this.shopperRequestRepo.update(requestId, {
        paymentStatus: 'paid',
        // Add transaction reference if needed
      } as any);

      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async processRefund(
    requestId: mongoose.Types.ObjectId,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    // Placeholder for refund processing
    // In Phase 4, this would integrate with payment processor

    try {
      const refundId = `ref_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Update request payment status
      await this.shopperRequestRepo.update(requestId, {
        paymentStatus: 'refunded',
      } as any);

      return {
        success: true,
        refundId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  async getPaymentStatus(requestId: mongoose.Types.ObjectId): Promise<string> {
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    return request.paymentStatus;
  }
}
