import { IBagItem } from '../models/BagItem';
import { ITrip } from '../models/Trip';
import { ITripRepository, IUserRepository } from './repositories';
import {  validateTripLeadTime } from '../config/businessRules';
import mongoose from 'mongoose';
import { z } from 'zod';

const matchCriteriaSchema = z.object({
  fromCountry: z.string().min(1),
  toCountry: z.string().min(1),
  maxArrivalWindowHours: z.number().positive().optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
});

export interface MatchResult {
  trip: ITrip;
  score: number;
  rationale: string[];
  capacityFit: {
    fitsCarryOn: boolean;
    fitsChecked: boolean;
    availableCarryOnKg: number;
    availableCheckedKg: number;
  };
}

export class MatchingService {
  constructor(
    private tripRepo: ITripRepository,
    private userRepo: IUserRepository
  ) {}

  async findMatches(
    bagItems: IBagItem[],
    criteria: z.infer<typeof matchCriteriaSchema>
  ): Promise<MatchResult[]> {
    const validatedCriteria = matchCriteriaSchema.parse(criteria);

    // Calculate bag totals
    const bagTotals = await this.calculateBagTotals(bagItems);

    // Find potential trips
    const allTrips = await this.tripRepo.findByRoute(
      validatedCriteria.fromCountry,
      validatedCriteria.toCountry
    );

    // Filter trips by lead time requirements
    const trips = allTrips.filter(trip => {
      const leadTimeValidation = validateTripLeadTime(trip.departureDate, {
        itemCount: bagItems.length,
        totalValue: bagTotals.totalValue,
        hasSpecialDelivery: bagTotals.hasSpecialDelivery,
      });
      return leadTimeValidation.valid;
    });

    const matches: MatchResult[] = [];

    for (const trip of trips) {
      const matchResult = await this.scoreTrip(
        trip,
        bagItems,
        bagTotals,
        validatedCriteria
      );
      if (matchResult) {
        matches.push(matchResult);
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  private async calculateBagTotals(bagItems: IBagItem[]): Promise<{
    totalWeight: number;
    totalValue: number;
    isFragile: boolean;
    hasSpecialDelivery: boolean;
  }> {
    let totalWeight = 0;
    let totalValue = 0;
    let isFragile = false;
    let hasSpecialDelivery = false;

    for (const item of bagItems) {
      totalWeight += item.weightKg * item.quantity;
      totalValue += item.price * item.quantity;
      if (item.isFragile) isFragile = true;
      if (item.requiresSpecialDelivery || item.specialDeliveryCategory) {
        hasSpecialDelivery = true;
      }
    }

    return { totalWeight, totalValue, isFragile, hasSpecialDelivery };
  }

  private async scoreTrip(
    trip: ITrip,
    bagItems: IBagItem[],
    bagTotals: {
      totalWeight: number;
      totalValue: number;
      isFragile: boolean;
      hasSpecialDelivery: boolean;
    },
    criteria: z.infer<typeof matchCriteriaSchema>
  ): Promise<MatchResult | null> {
    const rationale: string[] = [];
    let score = 0;

    // Check fragile capability
    if (bagTotals.isFragile && !trip.canCarryFragile) {
      return null; // Cannot match if fragile items but traveler cannot carry fragile
    }

    // Check special delivery capability
    if (bagTotals.hasSpecialDelivery && !trip.canHandleSpecialDelivery) {
      return null; // Cannot match if special delivery items but traveler cannot handle
    }

    // Capacity check
    const capacityFit = this.checkCapacity(trip, bagTotals.totalWeight);
    if (!capacityFit.fitsCarryOn && !capacityFit.fitsChecked) {
      return null; // Cannot fit in either carry-on or checked baggage
    }

    // Route match (perfect match)
    if (
      trip.fromCountry === criteria.fromCountry &&
      trip.toCountry === criteria.toCountry
    ) {
      score += 30;
      rationale.push('Perfect route match');
    }

    // Arrival window proximity (if maxArrivalWindowHours specified)
    // Arrival window proximity (if maxArrivalWindowHours specified)
    if (criteria.maxArrivalWindowHours) {
      const now = new Date();
      const arrivalTime = new Date(trip.arrivalDate);
      const hoursUntilArrival =
        (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (
        hoursUntilArrival >= 0 &&
        hoursUntilArrival <= criteria.maxArrivalWindowHours
      ) {
        score += 20;
        rationale.push('Within arrival window');
      }
    }
    // Capacity fit
    if (capacityFit.fitsCarryOn) {
      score += 25;
      rationale.push('Fits in carry-on baggage');
    } else if (capacityFit.fitsChecked) {
      score += 15;
      rationale.push('Fits in checked baggage');
    }

    // Traveler rating
    const traveler = await this.userRepo.findById(trip.travelerId);
    if (traveler && typeof traveler.rating === 'number') {
      const maxRating = traveler.maxRating || 5;
      const normalizedScore = (traveler.rating / maxRating) * 10;
      score += normalizedScore;
      rationale.push(`Traveler rating: ${traveler.rating}/${maxRating}`);
    }

    // Fragile capability bonus
    if (bagTotals.isFragile && trip.canCarryFragile) {
      score += 10;
      rationale.push('Traveler can handle fragile items');
    }

    // Special delivery capability bonus
    if (bagTotals.hasSpecialDelivery && trip.canHandleSpecialDelivery) {
      score += 5;
      rationale.push('Traveler can handle special delivery');
    }

    // Ensure score doesn't exceed 100
    score = Math.min(score, 100);

    return {
      trip,
      score,
      rationale,
      capacityFit,
    };
  }

  private checkCapacity(
    trip: ITrip,
    totalWeight: number
  ): {
    fitsCarryOn: boolean;
    fitsChecked: boolean;
    availableCarryOnKg: number;
    availableCheckedKg: number;
  } {
    const fitsCarryOn = totalWeight <= trip.availableCarryOnKg;
    const fitsChecked = totalWeight <= trip.availableCheckedKg;

    return {
      fitsCarryOn,
      fitsChecked,
      availableCarryOnKg: trip.availableCarryOnKg,
      availableCheckedKg: trip.availableCheckedKg,
    };
  }

  async getTopMatches(
    bagItems: IBagItem[],
    criteria: z.infer<typeof matchCriteriaSchema>,
    limit: number = 10
  ): Promise<MatchResult[]> {
    const matches = await this.findMatches(bagItems, criteria);
    return matches.slice(0, limit);
  }

  async validateMatchFeasibility(
    tripId: mongoose.Types.ObjectId,
    bagItems: IBagItem[]
  ): Promise<{ feasible: boolean; issues: string[] }> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      return { feasible: false, issues: ['Trip not found'] };
    }

    const bagTotals = await this.calculateBagTotals(bagItems);
    const issues: string[] = [];

    // Check fragile capability
    if (bagTotals.isFragile && !trip.canCarryFragile) {
      issues.push('Trip cannot handle fragile items');
    }

    // Check special delivery capability
    if (bagTotals.hasSpecialDelivery && !trip.canHandleSpecialDelivery) {
      issues.push('Trip cannot handle special delivery items');
    }

    // Check capacity
    const capacityFit = this.checkCapacity(trip, bagTotals.totalWeight);
    if (!capacityFit.fitsCarryOn && !capacityFit.fitsChecked) {
      issues.push('Items exceed available baggage capacity');
    }

    return { feasible: issues.length === 0, issues };
  }
}
