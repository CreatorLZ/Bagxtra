import { IMatch, MatchStatus } from '../models/Match';
import { IShopperRequest } from '../models/ShopperRequest';
import {
  IMatchRepository,
  IShopperRequestRepository,
  ITripRepository,
  IBagItemRepository,
  IUserRepository,
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
    private userRepo: IUserRepository,
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
    const requestItemIds = request.bagItems.map(item => {
      if (!item._id) {
        throw new Error('Bag item is missing an ID');
      }
      return item._id.toString();
    });
    const invalidItems = validatedData.assignedItems.filter(
      id => !requestItemIds.includes(id)
    );
    if (invalidItems.length > 0) {
      throw new Error(
        `Assigned items ${invalidItems.join(', ')} do not belong to this request`
      );
    }

    // Check for duplicate assigned items in other matches
    const existingMatches = await this.matchRepo.findByRequest(match.requestId);
    const activeMatches = existingMatches.filter(
      m => m.status === MatchStatus.Claimed || m.status === MatchStatus.Approved
    );
    const claimedItems = activeMatches.flatMap(
      m => m.assignedItems.map(id => id.toString())
    );
    const duplicates = validatedData.assignedItems.filter(
      id => claimedItems.includes(id)
    );
    if (duplicates.length > 0) {
      throw new Error(`Items ${duplicates.join(', ')} are already claimed by another match`);
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

    if (match.status !== MatchStatus.Pending && match.status !== MatchStatus.Claimed) {
      throw new Error('Match must be pending or claimed before approval');
    }

    // Start cooldown period
    const cooldownEndsAt = new Date();
    cooldownEndsAt.setHours(cooldownEndsAt.getHours() + BUSINESS_RULES.cooldowns.shopperPaymentCooldownHours);

    const purchaseDeadline = new Date(cooldownEndsAt);
    purchaseDeadline.setHours(purchaseDeadline.getHours() + BUSINESS_RULES.cooldowns.travelerPurchaseWindowHours);

    // Auto-assign all items if match was pending (direct booking)
    let assignedItems = match.assignedItems;
    if (match.status === MatchStatus.Pending) {
      // Assign all items from the request
      assignedItems = request.bagItems
        .map(item => item._id)
        .filter(id => id !== undefined) as mongoose.Types.ObjectId[];
    }

    // Update match and request
    const matchUpdate: Partial<IMatch> = {
      status: MatchStatus.Approved,
      assignedItems,
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
      const shopper = await this.userRepo.findById(request.shopperId);
      const userLocale = shopper?.locale || 'en-US';
      await this.notificationService.sendBookingConfirmation(
        request.shopperId,
        match.travelerId,
        matchId,
        cooldownEndsAt,
        userLocale
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
      cooldownEndsAt: null as any,
      purchaseDeadline: null as any,
    };

    if (validatedData.reason) {
      requestUpdate.cancellationReason = validatedData.reason;
    }

    await this.shopperRequestRepo.update(request._id, requestUpdate);
    return await this.matchRepo.update(matchId, matchUpdate);
  }

  /**
   * Process expired cooldowns (called by cron job)
   */
  async processExpiredCooldowns(): Promise<{ processed: number; errors: number }> {
    const now = new Date();
    let processed = 0;
    let errors = 0;

    // Find requests where cooldown has expired
    const expiredCooldowns = await this.shopperRequestRepo.findByStatusAndCooldown('on_hold', now);

    for (const request of expiredCooldowns) {
      // Concurrency check: re-fetch to ensure not already processed
      const currentRequest = await this.shopperRequestRepo.findById(request._id);
      if (!currentRequest || currentRequest.cooldownProcessed) {
        continue; // Already processed by another instance
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // Update request status
          await this.shopperRequestRepo.update(request._id, {
            status: 'purchase_pending',
            cooldownProcessed: true,
          }, session);

          // Find and update related matches
          const matches = await this.matchRepo.findByRequest(request._id);
          for (const match of matches) {
            if (match.status === MatchStatus.Approved) {
              // Mark purchase phase as started
              await this.matchRepo.update(match._id as mongoose.Types.ObjectId, {
                purchasePhaseStarted: true,
              }, session);

              // Notify traveler that purchase window has started
              if (this.notificationService) {
                await this.notificationService.sendPurchaseDeadlineReminder(
                  match.travelerId,
                  match._id as mongoose.Types.ObjectId,
                  BUSINESS_RULES.cooldowns.travelerPurchaseWindowHours
                );
              }
            }
          }
        });
        processed++;
      } catch (error) {
        console.error(`Error processing expired cooldown for request ${request._id}:`, error);
        errors++;
      } finally {
        await session.endSession();
      }
    }

    return { processed, errors };
  }

  /**
   * Process missed purchase deadlines (called by cron job)
   */
  async processMissedPurchaseDeadlines(): Promise<{ cancelled: number; errors: number }> {
    const now = new Date();
    let cancelled = 0;
    let errors = 0;

    // Find requests where purchase deadline has passed
    const missedDeadlines = await this.shopperRequestRepo.findByStatusAndDeadline('purchase_pending', now);

    for (const request of missedDeadlines) {
      // Concurrency check: re-fetch to ensure not already processed
      const currentRequest = await this.shopperRequestRepo.findById(request._id);
      if (!currentRequest || currentRequest.status !== 'purchase_pending') {
        continue; // Already processed by another instance
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // Cancel request
          await this.shopperRequestRepo.update(request._id, {
            status: 'cancelled',
            cancellationReason: 'Purchase deadline missed by traveler',
          }, session);

          // Cancel related matches
          const matches = await this.matchRepo.findByRequest(request._id);
          for (const match of matches) {
            if (match.status === MatchStatus.Approved) {
              await this.matchRepo.update(match._id as mongoose.Types.ObjectId, {
                status: MatchStatus.Rejected,
              }, session);
            }
          }
        });
        cancelled++;
      } catch (error) {
        console.error(`Error processing missed purchase deadline for request ${request._id}:`, error);
        errors++;
      } finally {
        await session.endSession();
      }
    }

    return { cancelled, errors };
  }

  private async checkCapacity(
    tripId: mongoose.Types.ObjectId,
    assignedItemIds: string[]
  ): Promise<{ canAssign: boolean; reason?: string }> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      return { canAssign: false, reason: 'Trip not found' };
    }

    // Fetch existing matches for the trip with status Claim or Approved
    const existingMatches = await this.matchRepo.findByTrip(tripId);
    const activeMatches = existingMatches.filter(
      match => match.status === MatchStatus.Claimed || match.status === MatchStatus.Approved
    );

    // Collect assigned item IDs from existing matches
    const assignedItemIdsFromMatches = activeMatches.flatMap(
      match => match.assignedItems.map(id => id.toString())
    );

    // Filter out any overlapping item IDs (though unlikely)
    const existingItemIds = assignedItemIdsFromMatches.filter(
      id => !assignedItemIds.includes(id)
    );

    // Load existing items and compute their total weight
    const existingItems = await this.bagItemRepo.findByIds(existingItemIds);
    const existingWeight = existingItems.reduce(
      (sum, item) => sum + item.weightKg * item.quantity,
      0
    );

    // Calculate total weight of newly assigned items
    const assignedItemObjectIds = assignedItemIds.map(
      id => new mongoose.Types.ObjectId(id)
    );
    const items = await this.bagItemRepo.findByIds(
      assignedItemObjectIds.map(id => id.toString())
    );
    if (items.length !== assignedItemIds.length) {
      throw new Error('Some assigned items not found');
    }
    const newWeight = items.reduce(
      (sum, item) => sum + item.weightKg * item.quantity,
      0
    );

    // Total weight including existing
    const totalWeight = newWeight + existingWeight;

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