import { IMatch, MatchStatus } from '../models/Match';
import { IShopperRequest } from '../models/ShopperRequest';
import { IMatchRepository, IShopperRequestRepository } from './repositories';
import mongoose from 'mongoose';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { ValidationError, BadRequestError } from '../errors';

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
    if (!mongoose.isValidObjectId(validatedData.matchId)) {
      throw new ValidationError(
        'Invalid matchId: must be a valid ObjectId',
        'matchId'
      );
    }
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    // Verify match exists and traveler owns it
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to generate PIN for this match');
    }

    if (match.status !== MatchStatus.Approved) {
      throw new Error('Match must be approved before generating delivery PIN');
    }

    // Generate 5-digit random PIN
    const pin = this.generateRandomPin();

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const updateResult = await this.matchRepo.update(matchId, {
      deliveryPin: pin,
      deliveryPinExpiresAt: expiresAt,
      deliveryPinGeneratedAt: new Date(),
    });

    if (!updateResult) {
      throw new Error('Failed to persist delivery PIN');
    }

    return { pin, expiresAt };
  }

  async verifyDeliveryPin(
    verificationData: z.infer<typeof verifyPinSchema>,
    shopperId: mongoose.Types.ObjectId
  ): Promise<{ verified: boolean; match?: IMatch; error?: string }> {
    const validatedData = verifyPinSchema.parse(verificationData);
    if (!mongoose.isValidObjectId(validatedData.matchId)) {
      throw new ValidationError(
        'Invalid matchId: must be a valid ObjectId',
        'matchId'
      );
    }
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

    // Check if PIN has expired
    const now = new Date();
    if (match.deliveryPinExpiresAt && match.deliveryPinExpiresAt < now) {
      return { verified: false, error: 'PIN has expired' };
    }

    // Check if deliveryPin exists
    if (!match.deliveryPin) {
      return { verified: false, error: 'Invalid PIN' };
    }

    // Use safe equality check for PIN comparison
    const isValidPin = timingSafeEqual(
      Buffer.from(match.deliveryPin, 'utf8'),
      Buffer.from(validatedData.pin, 'utf8')
    );

    if (!isValidPin) {
      return { verified: false, error: 'Invalid PIN' };
    }

    // Mark delivery as completed and set PIN verification timestamp
    await this.matchRepo.update(matchId, {
      status: MatchStatus.Completed,
      pinVerifiedAt: new Date(),
    } as any);

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

    if (match.status !== MatchStatus.Approved) {
      throw new Error('Match must be approved before marking as delivered');
    }

    // Check if PIN was verified before allowing delivery
    if (!match.pinVerifiedAt) {
      throw new Error(
        'Delivery PIN must be verified before marking as delivered'
      );
    }

    // Update match status to completed with proper typing
    const updatePayload: Partial<IMatch> = { status: MatchStatus.Completed };
    return await this.matchRepo.update(matchId, updatePayload);
  }

  private generateRandomPin(): string {
    // Generate a 5-digit random number
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    return pin;
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
