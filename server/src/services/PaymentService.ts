import { IShopperRequest } from '../models/ShopperRequest';
import { IMatch } from '../models/Match';
import { IShopperRequestRepository } from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const escrowHoldSchema = z.object({
  requestId: z.string(),
  amount: z.number().positive(),
});

const escrowReleaseSchema = z.object({
  matchId: z.string(),
  releaseType: z.enum(['completion', 'refund', 'partial_refund']),
  reason: z.string().optional(),
});

export interface EscrowStatus {
  held: boolean;
  amount: number;
  heldAt?: Date | undefined;
  releasedAt?: Date | undefined;
  releaseType?: 'completion' | 'refund' | 'partial_refund' | undefined;
  releaseReason?: string | undefined;
}

export class PaymentService {
  constructor(
    private shopperRequestRepo: IShopperRequestRepository
  ) {}

  /**
   * SIMULATION: Hold payment in escrow when match is approved
   * In production, this would integrate with Stripe/PayPal
   */
  async holdInEscrow(
    escrowData: z.infer<typeof escrowHoldSchema>
  ): Promise<{ success: boolean; escrowId: string }> {
    const validatedData = escrowHoldSchema.parse(escrowData);

    if (!mongoose.isValidObjectId(validatedData.requestId)) {
      throw new Error('Invalid request ID');
    }

    const requestId = new mongoose.Types.ObjectId(validatedData.requestId);

    // Verify request exists and is in correct status
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }

    if (request.status !== 'on_hold') {
      throw new Error('Request must be on hold to place payment in escrow');
    }

    // SIMULATION: In production, this would call Stripe/PayPal API
    // For now, just log the escrow hold
    console.log(`💰 ESCROW HOLD: $${validatedData.amount} for request ${requestId}`);

    // Generate mock escrow ID
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, you would store escrow details in database
    // For simulation, we just return success

    return {
      success: true,
      escrowId,
    };
  }

  /**
   * SIMULATION: Release payment from escrow upon completion
   * In production, this would integrate with Stripe/PayPal
   */
  async releaseFromEscrow(
    releaseData: z.infer<typeof escrowReleaseSchema>
  ): Promise<{ success: boolean; releasedAmount: number; fees: { traveler: number; vendor: number; platform: number } }> {
    const validatedData = escrowReleaseSchema.parse(releaseData);

    if (!mongoose.isValidObjectId(validatedData.matchId)) {
      throw new Error('Invalid match ID');
    }

    // SIMULATION: Calculate distribution
    // In production, this would be based on actual held amount
    const totalAmount = 150.00; // Mock amount from business rules
    const platformFee = totalAmount * 0.10; // 10% platform fee
    const vendorFee = totalAmount * 0.05;   // 5% vendor fee
    const travelerAmount = totalAmount - platformFee - vendorFee;

    console.log(`💰 ESCROW RELEASE: $${totalAmount} distributed`);
    console.log(`  - Traveler: $${travelerAmount.toFixed(2)}`);
    console.log(`  - Vendor: $${vendorFee.toFixed(2)}`);
    console.log(`  - Platform: $${platformFee.toFixed(2)}`);

    // SIMULATION: In production, this would call Stripe/PayPal transfer APIs
    // Transfer to traveler wallet
    // Transfer to vendor account
    // Keep platform fee

    return {
      success: true,
      releasedAmount: totalAmount,
      fees: {
        traveler: travelerAmount,
        vendor: vendorFee,
        platform: platformFee,
      },
    };
  }

  /**
   * SIMULATION: Process refund from escrow
   * In production, this would integrate with Stripe/PayPal
   */
  async processRefund(
    matchId: mongoose.Types.ObjectId,
    refundAmount: number,
    reason: string
  ): Promise<{ success: boolean; refundedAmount: number }> {
    console.log(`💰 ESCROW REFUND: $${refundAmount} for match ${matchId}`);
    console.log(`  Reason: ${reason}`);

    // SIMULATION: In production, this would initiate refund via payment processor
    // Refund to shopper's original payment method

    return {
      success: true,
      refundedAmount: refundAmount,
    };
  }

  /**
   * SIMULATION: Get escrow status for a request
   */
  async getEscrowStatus(requestId: mongoose.Types.ObjectId): Promise<EscrowStatus> {
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }

    // SIMULATION: Mock escrow status based on request status
    if (request.status === 'on_hold') {
      return {
        held: true,
        amount: 150.00, // Mock amount
        heldAt: request.cooldownEndsAt,
      };
    }

    if (request.status === 'completed') {
      return {
        held: false,
        amount: 150.00,
        heldAt: request.cooldownEndsAt,
        releasedAt: new Date(), // Mock release time
        releaseType: 'completion',
      };
    }

    if (request.status === 'cancelled') {
      return {
        held: false,
        amount: 150.00,
        heldAt: request.cooldownEndsAt,
        releasedAt: new Date(),
        releaseType: 'refund',
        releaseReason: request.cancellationReason || 'Request cancelled',
      };
    }

    // Default: no escrow
    return {
      held: false,
      amount: 0,
    };
  }

  /**
   * SIMULATION: Calculate fees for a transaction
   */
  calculateFees(amount: number): { traveler: number; vendor: number; platform: number; total: number } {
    const platformFee = amount * 0.10; // 10%
    const vendorFee = amount * 0.05;   // 5%
    const travelerAmount = amount - platformFee - vendorFee;

    return {
      traveler: travelerAmount,
      vendor: vendorFee,
      platform: platformFee,
      total: amount,
    };
  }

  /**
   * SIMULATION: Validate payment method (placeholder)
   */
  async validatePaymentMethod(userId: mongoose.Types.ObjectId): Promise<boolean> {
    // SIMULATION: In production, check if user has valid payment method on file
    console.log(`💳 Validating payment method for user ${userId}`);
    return true; // Mock success
  }

  /**
   * SIMULATION: Process payment (placeholder for booking)
   */
  async processPayment(
    userId: mongoose.Types.ObjectId,
    amount: number,
    description: string
  ): Promise<{ success: boolean; transactionId: string }> {
    // SIMULATION: In production, charge card via Stripe/PayPal
    console.log(`💳 Processing payment: $${amount} for user ${userId} - ${description}`);

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId,
    };
  }
}
