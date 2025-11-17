import { ITrip, TripUpdateData, TripStatus } from '../models/Trip';
import { IUser } from '../models/User';
import { ITripRepository, IUserRepository } from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const createTripSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  toCountry: z.string().min(1).max(100),
  departureDate: z.preprocess(
    val => (typeof val === 'string' ? new Date(val) : val),
    z.date()
  ),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  arrivalDate: z.preprocess(
    val => (typeof val === 'string' ? new Date(val) : val),
    z.date()
  ),
  arrivalTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  availableCarryOnKg: z.number().positive(),
  availableCheckedKg: z.number().positive(),
  ticketPhoto: z.string().url().optional(),
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

    // Validate dates and times
    if (validatedData.departureDate > validatedData.arrivalDate) {
      throw new Error('Arrival date must be after departure date');
    } else if (validatedData.departureDate.getTime() === validatedData.arrivalDate.getTime()) {
      // Same date, check times
      const depTimeParts = validatedData.departureTime.split(':');
      const arrTimeParts = validatedData.arrivalTime.split(':');
      if (depTimeParts.length !== 2 || arrTimeParts.length !== 2) {
        throw new Error('Invalid time format');
      }
      const depMinutes = parseInt(depTimeParts[0]!) * 60 + parseInt(depTimeParts[1]!);
      const arrMinutes = parseInt(arrTimeParts[0]!) * 60 + parseInt(arrTimeParts[1]!);
      if (depMinutes >= arrMinutes) {
        throw new Error('Arrival time must be after departure time');
      }
    }

    // Validate traveler exists and is a traveler
    const traveler = await this.userRepo.findById(travelerId);
    if (!traveler) {
      throw new Error('Traveler not found');
    }
    if (traveler.role !== 'traveler') {
      throw new Error('User is not a traveler');
    }

    const createData = {
      ...validatedData,
      travelerId,
      status: 'pending' as TripStatus,
    };

    // Remove ticketPhoto if it's undefined to avoid type issues
    if (createData.ticketPhoto === undefined) {
      delete (createData as any).ticketPhoto;
    }

    const trip = await this.tripRepo.create(createData as Partial<ITrip>);

    return trip;
  }

  async updateTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId,
    updates: z.infer<typeof updateTripSchema>
  ): Promise<ITrip | null> {
    const validatedUpdates = updateTripSchema.parse(updates) as TripUpdateData;

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

    // Validate merged dates and times
    const resultingDeparture =
      validatedUpdates.departureDate ?? trip.departureDate;
    const resultingArrival = validatedUpdates.arrivalDate ?? trip.arrivalDate;
    const resultingDepTime = validatedUpdates.departureTime ?? trip.departureTime;
    const resultingArrTime = validatedUpdates.arrivalTime ?? trip.arrivalTime;
    if (resultingDeparture && resultingArrival) {
      if (resultingDeparture > resultingArrival) {
        throw new Error('Arrival date must be after departure date');
      } else if (resultingDeparture.getTime() === resultingArrival.getTime()) {
        // Same date, check times
        const depTimeParts = resultingDepTime.split(':');
        const arrTimeParts = resultingArrTime.split(':');
        if (depTimeParts.length !== 2 || arrTimeParts.length !== 2) {
          throw new Error('Invalid time format');
        }
        const depMinutes = parseInt(depTimeParts[0]!) * 60 + parseInt(depTimeParts[1]!);
        const arrMinutes = parseInt(arrTimeParts[0]!) * 60 + parseInt(arrTimeParts[1]!);
        if (depMinutes >= arrMinutes) {
          throw new Error('Arrival time must be after departure time');
        }
      }
    }

    return await this.tripRepo.update(tripId, validatedUpdates);
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

  async activateTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    // Verify ownership
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized to activate this trip');
    }

    if (trip.status !== 'pending') {
      throw new Error('Trip is not pending');
    }

    return await this.tripRepo.update(tripId, { status: 'active' as TripStatus, activatedAt: new Date() });
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

    if (trip.status !== 'active') {
      throw new Error('Trip must be active before completion');
    }

    if (trip.ordersDelivered < trip.ordersCount) {
      await this.tripRepo.update(tripId, { hasIssues: true, issueReason: 'Undelivered orders' });
      throw new Error('Cannot complete trip with undelivered orders');
    }

    return await this.tripRepo.update(tripId, { status: 'completed' as TripStatus, completedAt: new Date() });
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

    if (usedWeight > currentCapacity) {
      throw new Error('Insufficient capacity');
    }

    const newCapacity = currentCapacity - usedWeight;

    return await this.tripRepo.update(tripId, {
      [updateField]: newCapacity,
    } as any);
  }

  async cancelTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized');
    }
    if (trip.status !== 'pending') {
      throw new Error('Can only cancel pending trips');
    }
    if (trip.ordersCount > 0) {
      throw new Error('Cannot cancel trip with orders');
    }
    const updateData: Partial<ITrip> = {
      status: 'cancelled' as TripStatus,
      cancelledAt: new Date(),
    };
    if (reason) {
      updateData.cancellationReason = reason;
    }
    return this.tripRepo.update(tripId, updateData);
  }

  async markAirborne(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized');
    }
    if (trip.status !== 'pending') {
      throw new Error('Trip not pending');
    }
    return this.tripRepo.update(tripId, {
      status: 'active' as TripStatus,
      activatedAt: new Date(),
      manuallyActivated: true
    });
  }

  async markArrived(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new Error('Unauthorized');
    }
    if (trip.status !== 'active') {
      throw new Error('Trip not active');
    }
    return this.tripRepo.update(tripId, {
      arrivedAt: new Date(),
      manuallyArrived: true
    });
  }
}
