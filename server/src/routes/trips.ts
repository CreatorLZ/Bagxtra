import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { TripService } from '../services/TripService.js';
import { TripRepository, UserRepository } from '../services/repositoryImpl.js';
import { z } from 'zod';

const router = Router();

// Initialize repositories and service
const tripRepository = new TripRepository();
const userRepository = new UserRepository();
const tripService = new TripService(tripRepository, userRepository);

const createTripSchema = z.object({
  fromCountry: z.string().min(1).max(100),
  toCountry: z.string().min(1).max(100),
  departureDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  arrivalDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  arrivalTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  availableCarryOnKg: z.number().positive(),
  availableCheckedKg: z.number().positive(),
  ticketPhoto: z.string().url().optional(),
  canCarryFragile: z.boolean(),
  canHandleSpecialDelivery: z.boolean(),
});

const updateTicketPhotoSchema = z.object({
  ticketPhoto: z.string().url(),
});

/**
 * @route GET /api/trips
 * @desc Get all trips for the authenticated traveler
 * @access Private (Traveler only)
 */
router.get('/', requireAuth, authorizeRoles('traveler'), async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Get user's trips
    const trips = await tripService.getTravelerTrips(userId as any);

    res.status(200).json({
      success: true,
      data: trips.map(trip => ({
        id: trip._id,
        fromCountry: trip.fromCountry,
        toCountry: trip.toCountry,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalDate: trip.arrivalDate,
        arrivalTime: trip.arrivalTime,
        availableCarryOnKg: trip.availableCarryOnKg,
        availableCheckedKg: trip.availableCheckedKg,
        ticketPhoto: trip.ticketPhoto,
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trips',
    });
  }
});

/**
 * @route POST /api/trips
 * @desc Create a new trip
 * @access Private (Traveler only)
 */
router.post('/', requireAuth, authorizeRoles('traveler'), async (req, res) => {
  try {
    const tripData = createTripSchema.parse(req.body);

    // Get user ID from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Convert date strings to Date objects and combine with times
    const departureDateTime = new Date(`${tripData.departureDate} ${tripData.departureTime}`);
    const arrivalDateTime = new Date(`${tripData.arrivalDate} ${tripData.arrivalTime}`);

    // Validate date/time logic
    if (departureDateTime >= arrivalDateTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Arrival date/time must be after departure date/time',
      });
    }

    // Prepare data for service
    const serviceData = {
      fromCountry: tripData.fromCountry,
      toCountry: tripData.toCountry,
      departureDate: departureDateTime,
      departureTime: tripData.departureTime,
      arrivalDate: arrivalDateTime,
      arrivalTime: tripData.arrivalTime,
      availableCarryOnKg: tripData.availableCarryOnKg,
      availableCheckedKg: tripData.availableCheckedKg,
      ticketPhoto: tripData.ticketPhoto || undefined,
      canCarryFragile: tripData.canCarryFragile,
      canHandleSpecialDelivery: tripData.canHandleSpecialDelivery,
    };

    // Create the trip
    const trip = await tripService.createTrip(userId as any, serviceData);

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: {
        id: trip._id,
        fromCountry: trip.fromCountry,
        toCountry: trip.toCountry,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        availableCarryOnKg: trip.availableCarryOnKg,
        availableCheckedKg: trip.availableCheckedKg,
        ticketPhoto: trip.ticketPhoto,
        status: trip.status,
        createdAt: trip.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating trip:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create trip',
    });
  }
});

/**
 * @route PUT /api/trips/:tripId/ticket-photo
 * @desc Update ticket photo for a trip
 * @access Private (Traveler only)
 */
router.put('/:tripId/ticket-photo', requireAuth, authorizeRoles('traveler'), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { ticketPhoto } = updateTicketPhotoSchema.parse(req.body);

    // Get user ID from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Update the trip with the photo URL
    const updatedTrip = await tripService.updateTrip(
      tripId as any,
      userId as any,
      { ticketPhoto }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Trip not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket photo updated successfully',
      data: {
        tripId: updatedTrip._id,
        ticketPhoto: updatedTrip.ticketPhoto,
      },
    });
  } catch (error) {
    console.error('Error updating ticket photo:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update ticket photo',
    });
  }
});

export default router;