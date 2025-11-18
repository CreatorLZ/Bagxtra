import { IMatch, MatchStatus } from '../models/Match';
import { IShopperRequest } from '../models/ShopperRequest';
import {
  IMatchRepository,
  IShopperRequestRepository,
  ITripRepository,
  IBagItemRepository,
} from './repositories';
import { BUSINESS_RULES } from '../config/businessRules';
import { NotificationService } from './NotificationService';
import mongoose from 'mongoose';
import { z } from 'zod';

const claimMatchSchema = z.object({
  matchId: z.string(),
  assignedItems: z.array(z.string()).min(1),
});

const approveMatchSchema = z.object({
  matchId: z.string(),
});

const cancelMatchSchema = z.object({
  matchId: z.string(),
  reason: z.string().optional(),
});

export class BookingService {
  constructor(
    private matchRepo: IMatchRepository,
    private shopperRequestRepo: IShopperRequestRepository,
    private tripRepo: ITripRepository,
    private bagItemRepo: IBagItemRepository,
    private notificationService?: NotificationService
  ) {}

  /**
   * Traveler claims a match (assigns specific items to carry)
   */
  async claimMatch(
    travelerId: mongoose.Types.ObjectId,
    claimData: z.infer<typeof claimMatchSchema>
  ): Promise<IMatch | null> {
    const validatedData = claimMatchSchema.parse(claimData);
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Verify traveler owns the trip
    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to claim this match');
    }

    if (match.status !== MatchStatus.Pending) {
      throw new Error('Match is not available for claiming');
    }

    // Validate capacity
    const capacityCheck = await this.checkCapacity(
      match.tripId,
      validatedData.assignedItems
    );
    if (!capacityCheck.canAssign) {
      throw new Error(capacityCheck.reason);
    }

    // Validate assigned items belong to the request
    const request = await this.shopperRequestRepo.findById(match.requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }
    const requestItemIds = request.bagItems.map(item => item._id!.toString());
    const invalidItems = validatedData.assignedItems.filter(
      id => !requestItemIds.includes(id)
    );
    if (invalidItems.length > 0) {
      throw new Error(
        `Assigned items ${invalidItems.join(', ')} do not belong to this request`
      );
    }

    // Update match status and assigned items
    const assignedItemIds = validatedData.assignedItems.map(
      id => new mongoose.Types.ObjectId(id)
    );
    const updatePayload: Partial<IMatch> = {
      status: MatchStatus.Claimed,
      assignedItems: assignedItemIds,
    };

    return await this.matchRepo.update(matchId, updatePayload);
  }

  /**
   * Shopper approves a claimed match (starts cooldown period)
   */
  async approveMatch(
    shopperId: mongoose.Types.ObjectId,
    approvalData: z.infer<typeof approveMatchSchema>
  ): Promise<IMatch | null> {
    const validatedData = approveMatchSchema.parse(approvalData);
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Verify shopper owns the request
    const request = await this.shopperRequestRepo.findById(match.requestId);
    if (!request || !request.shopperId.equals(shopperId)) {
      throw new Error('Unauthorized to approve this match');
    }

    if (match.status !== MatchStatus.Claimed) {
      throw new Error('Match must be claimed before approval');
    }

    // Start cooldown period
    const cooldownEndsAt = new Date();
    cooldownEndsAt.setHours(cooldownEndsAt.getHours() + BUSINESS_RULES.cooldowns.shopperPaymentCooldownHours);

    const purchaseDeadline = new Date(cooldownEndsAt);
    purchaseDeadline.setHours(purchaseDeadline.getHours() + BUSINESS_RULES.cooldowns.travelerPurchaseWindowHours);

    // Update match and request
    const matchUpdate: Partial<IMatch> = {
      status: MatchStatus.Approved,
    };

    const requestUpdate: Partial<IShopperRequest> = {
      status: 'on_hold',
      cooldownEndsAt,
      purchaseDeadline,
      cooldownProcessed: false,
    };

    await this.shopperRequestRepo.update(match.requestId, requestUpdate);
    const updatedMatch = await this.matchRepo.update(matchId, matchUpdate);

    // Send notifications
    if (this.notificationService) {
      await this.notificationService.sendBookingConfirmation(
        request.shopperId,
        match.travelerId,
        matchId,
        cooldownEndsAt
      );
    }

    return updatedMatch;
  }

  /**
   * Cancel a match during cooldown period
   */
  async cancelMatchDuringCooldown(
    userId: mongoose.Types.ObjectId,
    cancelData: z.infer<typeof cancelMatchSchema>
  ): Promise<IMatch | null> {
    const validatedData = cancelMatchSchema.parse(cancelData);
    const matchId = new mongoose.Types.ObjectId(validatedData.matchId);

    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Verify user owns either the request or the trip
    const request = await this.shopperRequestRepo.findById(match.requestId);
    const trip = await this.tripRepo.findById(match.tripId);

    const isShopper = request && request.shopperId.equals(userId);
    const isTraveler = trip && trip.travelerId.equals(userId);

    if (!isShopper && !isTraveler) {
      throw new Error('Unauthorized to cancel this match');
    }

    // Check if still in cooldown period
    if (!request?.cooldownEndsAt || new Date() > request.cooldownEndsAt) {
      throw new Error('Cooldown period has expired');
    }

    // Cancel match and reset request
    const matchUpdate: Partial<IMatch> = {
      status: MatchStatus.Rejected,
    };

    const requestUpdate: Partial<IShopperRequest> = {
      status: 'open', // Make available for other matches
      cooldownProcessed: false,
    };

    // Handle unsetting date fields separately
    await this.shopperRequestRepo.update(request._id, {
      ...requestUpdate,
      cooldownEndsAt: null as any,
      purchaseDeadline: null as any,
    });

    if (validatedData.reason) {
      requestUpdate.cancellationReason = validatedData.reason;
    }

    await this.shopperRequestRepo.update(match.requestId, requestUpdate);
    return await this.matchRepo.update(matchId, matchUpdate);
  }

  /**
   * Process expired cooldowns (called by cron job)
   */
  async processExpiredCooldowns(): Promise<{ processed: number }> {
    const now = new Date();
    let processed = 0;

    // Find requests where cooldown has expired
    const expiredCooldowns = await this.shopperRequestRepo.findByStatusAndCooldown('on_hold', now);

    for (const request of expiredCooldowns) {
      // Update request status
      await this.shopperRequestRepo.update(request._id, {
        status: 'purchase_pending',
        cooldownProcessed: true,
      });

      // Find and update related matches
      const matches = await this.matchRepo.findByRequest(request._id);
      for (const match of matches) {
        if (match.status === MatchStatus.Approved) {
          // Keep approved matches active for purchase phase
          processed++;
        }
      }
    }

    return { processed };
  }

  /**
   * Process missed purchase deadlines (called by cron job)
   */
  async processMissedPurchaseDeadlines(): Promise<{ cancelled: number }> {
    const now = new Date();
    let cancelled = 0;

    // Find requests where purchase deadline has passed
    const missedDeadlines = await this.shopperRequestRepo.findByStatusAndDeadline('purchase_pending', now);

    for (const request of missedDeadlines) {
      // Cancel request and related matches
      await this.shopperRequestRepo.update(request._id, {
        status: 'cancelled',
        cancellationReason: 'Purchase deadline missed by traveler',
      });

      const matches = await this.matchRepo.findByRequest(request._id);
      for (const match of matches) {
        if (match.status === MatchStatus.Approved) {
          await this.matchRepo.update(match._id as mongoose.Types.ObjectId, {
            status: MatchStatus.Rejected,
          });
          cancelled++;
        }
      }
    }

    return { cancelled };
  }

  private async checkCapacity(
    tripId: mongoose.Types.ObjectId,
    assignedItemIds: string[]
  ): Promise<{ canAssign: boolean; reason?: string }> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      return { canAssign: false, reason: 'Trip not found' };
    }

    // Calculate total weight of assigned items
    const assignedItemObjectIds = assignedItemIds.map(
      id => new mongoose.Types.ObjectId(id)
    );
    const items = await this.bagItemRepo.findByIds(
      assignedItemObjectIds.map(id => id.toString())
    );
    if (items.length !== assignedItemIds.length) {
      throw new Error('Some assigned items not found');
    }
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weightKg * item.quantity,
      0
    );

    // Check if fits in available capacity
    const fitsCarryOn = totalWeight <= trip.availableCarryOnKg;
    const fitsChecked = totalWeight <= trip.availableCheckedKg;

    if (!fitsCarryOn && !fitsChecked) {
      return {
        canAssign: false,
        reason: `Total weight ${totalWeight}kg exceeds available capacity (${trip.availableCarryOnKg}kg carry-on, ${trip.availableCheckedKg}kg checked)`,
      };
    }

    return { canAssign: true };
  }
}