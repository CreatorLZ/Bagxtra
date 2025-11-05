import { ITrip } from '../models/Trip';
import { IUser } from '../models/User';
import { ITripRepository, IUserRepository } from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const createTripSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  toCountry: z.string().min(1).max(100),
  departureDate: z.date(),
  arrivalDate: z.date(),
  availableCarryOnKg: z.number().positive(),
  availableCheckedKg: z.number().positive(),
  canCarryFragile: z.boolean(),
  canHandleSpecialDelivery: z.boolean(),
});

const updateTripSchema = createTripSchema.partial();

export class TripService {
  constructor(
    private tripRepo: ITripRepository,
    private userRepo: IUserRepository
  ) {}

  async createTrip(
    travelerId: mongoose.Types.ObjectId,
    tripData: z.infer<typeof createTripSchema>
  ): Promise<ITrip> {
    const validatedData = createTripSchema.parse(tripData);

    // Validate dates
    if (validatedData.departureDate >= validatedData.arrivalDate) {
      throw new Error('Arrival date must be after departure date');
    }

    // Validate traveler exists and is a traveler
    const traveler = await this.userRepo.findById(travelerId);
    if (!traveler) {
      throw new Error('Traveler not found');
    }
    if (traveler.role !== 'traveler') {
      throw new Error('User is not a traveler');
    }

    const trip = await this.tripRepo.create({
      ...validatedData,
      travelerId,
      status: 'open' as const,
    });

    return trip;
  }

  async updateTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId,
    updates: z.infer<typeof updateTripSchema>
  ): Promise<ITrip | null> {
    const validatedUpdates = updateTripSchema.parse(updates);

    // Verify ownership
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to update this trip');
    }

    // Cannot update completed trips
    if (trip.status === 'completed') {
      throw new Error('Cannot update completed trip');
    }

    return await this.tripRepo.update(tripId, validatedUpdates as any);
  }

  async getTrip(tripId: mongoose.Types.ObjectId): Promise<ITrip | null> {
    return await this.tripRepo.findById(tripId);
  }

  async getTravelerTrips(
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip[]> {
    return await this.tripRepo.findByTraveler(travelerId);
  }

  async getOpenTrips(): Promise<ITrip[]> {
    return await this.tripRepo.findOpenTrips();
  }

  async getTripsByRoute(
    fromCountry: string,
    toCountry: string
  ): Promise<ITrip[]> {
    return await this.tripRepo.findByRoute(fromCountry, toCountry);
  }

  async closeTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    // Verify ownership
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to close this trip');
    }

    if (trip.status !== 'open') {
      throw new Error('Trip is not open');
    }

    return await this.tripRepo.update(tripId, { status: 'closed' } as any);
  }

  async completeTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    // Verify ownership
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to complete this trip');
    }

    if (trip.status !== 'closed') {
      throw new Error('Trip must be closed before completion');
    }

    return await this.tripRepo.update(tripId, { status: 'completed' } as any);
  }

  async validateTripCapacity(
    tripId: mongoose.Types.ObjectId,
    requiredWeight: number,
    isCarryOn: boolean = false
  ): Promise<{ available: boolean; availableWeight: number }> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const availableWeight = isCarryOn
      ? trip.availableCarryOnKg
      : trip.availableCheckedKg;
    const available = requiredWeight <= availableWeight;

    return { available, availableWeight };
  }

  async updateTripCapacity(
    tripId: mongoose.Types.ObjectId,
    usedWeight: number,
    isCarryOn: boolean = false
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const updateField = isCarryOn ? 'availableCarryOnKg' : 'availableCheckedKg';
    const currentCapacity = isCarryOn
      ? trip.availableCarryOnKg
      : trip.availableCheckedKg;
    const newCapacity = Math.max(0, currentCapacity - usedWeight);

    return await this.tripRepo.update(tripId, {
      [updateField]: newCapacity,
    } as any);
  }
}
