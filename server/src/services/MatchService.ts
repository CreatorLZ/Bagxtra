import { IMatch, MatchStatus } from '../models/Match';
import { IShopperRequest } from '../models/ShopperRequest';
import { ITrip } from '../models/Trip';
import { IBagItem } from '../models/BagItem';
import {
  IMatchRepository,
  IShopperRequestRepository,
  ITripRepository,
  IBagItemRepository,
} from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ValidationError } from '../errors';

const claimMatchSchema = z.object({
  matchId: z.string(),
  assignedItems: z.array(z.string()).min(1), // Array of bag item IDs
});

export class MatchService {
  constructor(
    private matchRepo: IMatchRepository,
    private shopperRequestRepo: IShopperRequestRepository,
    private tripRepo: ITripRepository,
    private bagItemRepo: IBagItemRepository
  ) {}

  async createMatch(
    requestId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    matchScore: number,
    assignedItems: mongoose.Types.ObjectId[]
  ): Promise<IMatch> {
    // Validate that request and trip exist
    const request = await this.shopperRequestRepo.findById(requestId);
    if (!request) {
      throw new Error('Shopper request not found');
    }

    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Validate assigned items belong to the request
    const requestItems = request.bagItems;
    const requestItemIds = requestItems.map(item => item._id!.toString());
    const assignedItemIds = assignedItems.map(id => id.toString());

    const invalidItems = assignedItemIds.filter(
      id => !requestItemIds.includes(id)
    );
    if (invalidItems.length > 0) {
      throw new Error(
        `Assigned items ${invalidItems.join(
          ', '
        )} do not belong to this request`
      );
    }

    return await this.matchRepo.create({
      requestId,
      tripId,
      travelerId: trip.travelerId,
      matchScore,
      assignedItems,
      status: 'pending' as MatchStatus,
    });
  }

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

    if (match.status !== 'pending') {
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
      throw new ValidationError(
        `Assigned items ${invalidItems.join(
          ', '
        )} do not belong to this request`
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

  async approveMatch(
    matchId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId
  ): Promise<IMatch | null> {
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Verify shopper owns the request
    const request = await this.shopperRequestRepo.findById(match.requestId);
    if (!request || !request.shopperId.equals(shopperId)) {
      throw new Error('Unauthorized to approve this match');
    }

    if (match.status !== 'claimed') {
      throw new Error('Match must be claimed before approval');
    }

    const updatePayload: Partial<IMatch> = {
      status: MatchStatus.Approved,
    };
    return await this.matchRepo.update(matchId, updatePayload);
  }

  async rejectMatch(
    matchId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IMatch | null> {
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
      throw new Error('Unauthorized to reject this match');
    }

    const updatePayload: Partial<IMatch> = {
      status: MatchStatus.Rejected,
    };
    return await this.matchRepo.update(matchId, updatePayload);
  }

  async completeMatch(
    matchId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<IMatch | null> {
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Verify traveler owns the trip
    if (!match.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to complete this match');
    }

    if (match.status !== 'approved') {
      throw new Error('Match must be approved before completion');
    }

    const updatePayload: Partial<IMatch> = {
      status: MatchStatus.Completed,
    };
    return await this.matchRepo.update(matchId, updatePayload);
  }

  async getMatchesByRequest(
    requestId: mongoose.Types.ObjectId
  ): Promise<IMatch[]> {
    return await this.matchRepo.findByRequest(requestId);
  }

  async getMatchesByTrip(tripId: mongoose.Types.ObjectId): Promise<IMatch[]> {
    return await this.matchRepo.findByTrip(tripId);
  }

  async getPendingMatches(): Promise<IMatch[]> {
    return await this.matchRepo.findPendingMatches();
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

  async assignPartialMatch(
    requestId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    assignedItemIds: mongoose.Types.ObjectId[],
    matchScore: number
  ): Promise<IMatch> {
    // Validate that assigned items are a subset of request items
    const requestItems = await this.bagItemRepo.findByShopperRequest(requestId);
    const requestItemIds = requestItems.map(item => item._id!.toString());

    const invalidItems = assignedItemIds.filter(
      id => !requestItemIds.includes(id.toString())
    );

    if (invalidItems.length > 0) {
      throw new Error('Some assigned items do not belong to this request');
    }

    return await this.createMatch(
      requestId,
      tripId,
      matchScore,
      assignedItemIds
    );
  }
}
