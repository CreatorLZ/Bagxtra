import { IMatch } from '../models/Match';
import { IShopperRequest } from '../models/ShopperRequest';
import { IMatchRepository, IShopperRequestRepository } from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const generatePinSchema = z.object({
  matchId: z.string(),
  storeLocation: z.string().min(1),
});

const verifyPinSchema = z.object({
  matchId: z.string(),
  pin: z.string().length(5),
});

export class DeliveryService {
  constructor(
    private matchRepo: IMatchRepository,
    private shopperRequestRepo: IShopperRequestRepository
  ) {}

  async generateVerificationPin(
    matchData: z.infer<typeof generatePinSchema>,
    travelerId: mongoose.Types.ObjectId
  ): Promise<{ pin: string; expiresAt: Date }> {
    const validatedData = generatePinSchema.parse(matchData);
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    // Verify match exists and traveler owns it
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to generate PIN for this match');
    }

    if (match.status !== 'approved') {
      throw new Error('Match must be approved before generating delivery PIN');
    }

    // Generate 5-digit random PIN
    const pin = this.generateRandomPin();

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // In a real implementation, you would store this PIN in the database
    // For now, we'll return it - in Phase 4, this would be persisted
    // You could add a deliveryPin field to the Match model

    return { pin, expiresAt };
  }

  async verifyDeliveryPin(
    verificationData: z.infer<typeof verifyPinSchema>,
    shopperId: mongoose.Types.ObjectId
  ): Promise<{ verified: boolean; match?: IMatch; error?: string }> {
    const validatedData = verifyPinSchema.parse(verificationData);
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    // Verify match exists
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      return { verified: false, error: 'Match not found' };
    }

    // Verify shopper owns the request
    const request = await this.shopperRequestRepo.findById(match.requestId);
    if (!request || !request.shopperId.equals(shopperId)) {
      return {
        verified: false,
        error: 'Unauthorized to verify PIN for this match',
      };
    }

    // In a real implementation, you would check the stored PIN and expiration
    // For now, we'll simulate PIN verification
    const isValidPin = this.verifyPin(validatedData.pin);

    if (!isValidPin) {
      return { verified: false, error: 'Invalid PIN' };
    }

    // Check if PIN has expired (placeholder - would check stored expiration)
    const now = new Date();
    // Placeholder expiration check
    const isExpired = false; // Would check against stored expiresAt

    if (isExpired) {
      return { verified: false, error: 'PIN has expired' };
    }

    // Mark delivery as completed
    await this.matchRepo.update(matchId, { status: 'completed' } as any);

    return { verified: true, match };
  }

  async getDeliveryStatus(matchId: mongoose.Types.ObjectId): Promise<{
    status: string;
    pinGenerated?: boolean;
    pinExpiresAt?: Date;
    deliveredAt?: Date;
  }> {
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // In a real implementation, you would check for PIN generation and delivery status
    // For now, return basic status
    return {
      status: match.status,
      // pinGenerated: check if PIN exists in DB
      // pinExpiresAt: get from DB
      // deliveredAt: get from DB
    };
  }

  async markAsDelivered(
    matchId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<IMatch | null> {
    // Verify match exists and traveler owns it
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to mark delivery for this match');
    }

    if (match.status !== 'approved') {
      throw new Error('Match must be approved before marking as delivered');
    }

    // Update match status to completed
    return await this.matchRepo.update(matchId, { status: 'completed' } as any);
  }

  private generateRandomPin(): string {
    // Generate a 5-digit random number
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    return pin;
  }

  private verifyPin(providedPin: string): boolean {
    // In a real implementation, you would compare against stored PIN
    // For now, accept any 5-digit PIN for simulation
    return /^\d{5}$/.test(providedPin);
  }

  async resendVerificationPin(
    matchId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<{ pin: string; expiresAt: Date }> {
    // Verify match exists and traveler owns it
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to resend PIN for this match');
    }

    // Generate new PIN
    return await this.generateVerificationPin(
      { matchId: matchId.toString(), storeLocation: 'N/A' },
      travelerId
    );
  }
}
