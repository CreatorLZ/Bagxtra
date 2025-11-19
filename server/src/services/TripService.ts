import { ITrip, TripUpdateData, TripStatus } from '../models/Trip';
import { ITripRepository, IUserRepository } from './repositories';
import { validateTripLeadTime } from '../config/businessRules';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  BadRequestError
} from '../errors';
import mongoose from 'mongoose';
import { z } from 'zod';
import { parseDateTimeToUTC } from '../utils/dateUtils';

const createTripSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  toCountry: z.string().min(1).max(100),
  departureDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  arrivalDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  arrivalTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  timezone: z.string().refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid timezone' }
  ),
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
    const validatedData = createTripSchema.parse(tripData) as Required<z.infer<typeof createTripSchema>>;

    const departureDate = parseDateTimeToUTC(validatedData.departureDate, validatedData.departureTime, validatedData.timezone);
    const arrivalDate = parseDateTimeToUTC(validatedData.arrivalDate, validatedData.arrivalTime, validatedData.timezone);

    if (departureDate > arrivalDate) {
      throw new ValidationError(
        'Arrival date must be after departure date.',
        'INVALID_DATES'
      );
    }

    const leadTimeValidation = validateTripLeadTime(departureDate);
    if (!leadTimeValidation.valid) {
      throw new ValidationError(
        leadTimeValidation.message || 'Trip does not meet lead time requirements',
        'INSUFFICIENT_LEAD_TIME',
        leadTimeValidation
      );
    }

    const traveler = await this.userRepo.findById(travelerId);
    if (!traveler) {
      throw new NotFoundError('Your account could not be found. Please try logging out and logging back in.');
    }
    if (traveler.role !== 'traveler') {
      throw new ForbiddenError('Only travelers can create trips.', 'INVALID_ROLE');
    }

    const createData = {
      travelerId,
      fromCountry: validatedData.fromCountry,
      toCountry: validatedData.toCountry,
      departureDate,
      departureTime: validatedData.departureTime,
      arrivalDate,
      arrivalTime: validatedData.arrivalTime,
      timezone: validatedData.timezone,
      availableCarryOnKg: validatedData.availableCarryOnKg,
      availableCheckedKg: validatedData.availableCheckedKg,
      ticketPhoto: validatedData.ticketPhoto || null,
      canCarryFragile: validatedData.canCarryFragile,
      canHandleSpecialDelivery: validatedData.canHandleSpecialDelivery,
      status: 'pending' as TripStatus,
    };

    return await this.tripRepo.create(createData);
  }

  async updateTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId,
    updates: z.infer<typeof updateTripSchema>
  ): Promise<ITrip | null> {
    const validatedUpdates = updateTripSchema.parse(updates);
    const trip = await this.tripRepo.findById(tripId);

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new ForbiddenError('Unauthorized to update this trip');
    }
    if (trip.status === 'completed') {
      throw new BadRequestError('Cannot update completed trip');
    }

    // Build update data with proper types
    const updateData: TripUpdateData = {};

    if (validatedUpdates.fromCountry !== undefined) updateData.fromCountry = validatedUpdates.fromCountry;
    if (validatedUpdates.toCountry !== undefined) updateData.toCountry = validatedUpdates.toCountry;
    if (validatedUpdates.timezone !== undefined) updateData.timezone = validatedUpdates.timezone;
    if (validatedUpdates.availableCarryOnKg !== undefined) updateData.availableCarryOnKg = validatedUpdates.availableCarryOnKg;
    if (validatedUpdates.availableCheckedKg !== undefined) updateData.availableCheckedKg = validatedUpdates.availableCheckedKg;
    if (validatedUpdates.ticketPhoto !== undefined) updateData.ticketPhoto = validatedUpdates.ticketPhoto;
    if (validatedUpdates.canCarryFragile !== undefined) updateData.canCarryFragile = validatedUpdates.canCarryFragile;
    if (validatedUpdates.canHandleSpecialDelivery !== undefined) updateData.canHandleSpecialDelivery = validatedUpdates.canHandleSpecialDelivery;

    // Handle departure date/time
    if (validatedUpdates.departureDate !== undefined) {
      const depTime = validatedUpdates.departureTime ?? trip.departureTime;
      const tz = validatedUpdates.timezone ?? trip.timezone;
      updateData.departureDate = parseDateTimeToUTC(validatedUpdates.departureDate, depTime, tz);
    }
    if (validatedUpdates.departureTime !== undefined) updateData.departureTime = validatedUpdates.departureTime;

    // Handle arrival date/time
    if (validatedUpdates.arrivalDate !== undefined) {
      const arrTime = validatedUpdates.arrivalTime ?? trip.arrivalTime;
      const tz = validatedUpdates.timezone ?? trip.timezone;
      updateData.arrivalDate = parseDateTimeToUTC(validatedUpdates.arrivalDate, arrTime, tz);
    }
    if (validatedUpdates.arrivalTime !== undefined) updateData.arrivalTime = validatedUpdates.arrivalTime;

    // Validate merged dates and times
    const resultingDeparture = updateData.departureDate ?? trip.departureDate;
    const resultingArrival = updateData.arrivalDate ?? trip.arrivalDate;
    const resultingDepTime = updateData.departureTime ?? trip.departureTime;
    const resultingArrTime = updateData.arrivalTime ?? trip.arrivalTime;
    if (resultingDeparture && resultingArrival) {
      if (resultingDeparture > resultingArrival) {
        throw new ValidationError('Arrival date must be after departure date', 'INVALID_DATES');
      } else if (resultingDeparture.getTime() === resultingArrival.getTime()) {
        // Same date, check times
        const depTimeParts = resultingDepTime.split(':');
        const arrTimeParts = resultingArrTime.split(':');
        if (depTimeParts.length !== 2 || arrTimeParts.length !== 2) {
          throw new BadRequestError('Invalid time format');
        }
        const depMinutes = parseInt(depTimeParts[0]!) * 60 + parseInt(depTimeParts[1]!);
        const arrMinutes = parseInt(arrTimeParts[0]!) * 60 + parseInt(arrTimeParts[1]!);
        if (depMinutes >= arrMinutes) {
          throw new ValidationError('Arrival time must be after departure time', 'INVALID_DATES');
        }
      }
    }

    return await this.tripRepo.update(tripId, updateData);
  }


  async activateTrip(tripId: mongoose.Types.ObjectId, travelerId: mongoose.Types.ObjectId, manual?: boolean): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    if (!trip.travelerId.equals(travelerId)) throw new ForbiddenError('Unauthorized');
    if (trip.status !== 'pending') throw new BadRequestError('Trip is not pending');

    const updateData: any = { status: 'active' as TripStatus, activatedAt: new Date() };
    if (manual) updateData.manuallyActivated = true;

    return await this.tripRepo.update(tripId, updateData);
  }

  async getTrip(tripId: mongoose.Types.ObjectId): Promise<ITrip | null> {
    return await this.tripRepo.findById(tripId);
  }

  async getTravelerTrips(travelerId: mongoose.Types.ObjectId): Promise<ITrip[]> {
    return await this.tripRepo.findByTraveler(travelerId);
  }

  async getOpenTrips(): Promise<ITrip[]> {
    return await this.tripRepo.findOpenTrips();
  }

  async getTripsByRoute(fromCountry: string, toCountry: string): Promise<ITrip[]> {
    return await this.tripRepo.findByRoute(fromCountry, toCountry);
  }

  async validateTripCapacity(
    tripId: mongoose.Types.ObjectId,
    requiredWeight: number,
    isCarryOn: boolean = false
  ): Promise<{ available: boolean; availableWeight: number }> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
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
      throw new NotFoundError('Trip not found');
    }

    const updateField = isCarryOn ? 'availableCarryOnKg' : 'availableCheckedKg';
    const currentCapacity = isCarryOn
      ? trip.availableCarryOnKg
      : trip.availableCheckedKg;

    if (usedWeight > currentCapacity) {
      throw new BadRequestError('Insufficient capacity');
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
      throw new NotFoundError('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new ForbiddenError('Unauthorized');
    }
    if (trip.status !== 'pending') {
      throw new BadRequestError('Can only cancel pending trips');
    }
    if (trip.ordersCount > 0) {
      throw new BadRequestError('Cannot cancel trip with orders');
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
    return this.activateTrip(tripId, travelerId, true);
  }

  async markArrived(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new ForbiddenError('Unauthorized');
    }
    if (trip.status !== 'active') {
      throw new BadRequestError('Trip not active');
    }
    return this.tripRepo.update(tripId, {
      arrivedAt: new Date(),
      manuallyArrived: true
    });
  }

  async completeTrip(
    tripId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId
  ): Promise<ITrip | null> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }
    if (!trip.travelerId.equals(travelerId)) {
      throw new ForbiddenError('Unauthorized to complete this trip');
    }

    if (trip.status !== 'active') {
      throw new BadRequestError('Trip must be active before completion');
    }

    if (trip.ordersDelivered < trip.ordersCount) {
      await this.tripRepo.update(tripId, { hasIssues: true, issueReason: 'Undelivered orders' });
      throw new BadRequestError('Cannot complete trip with undelivered orders');
    }

    return await this.tripRepo.update(tripId, { status: 'completed' as TripStatus, completedAt: new Date() });
  }
}