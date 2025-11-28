import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { validateParams, commonSchemas } from '../middleware/validation.js';
import { TripService } from '../services/TripService.js';
import { TripRepository, UserRepository } from '../services/repositoryImpl.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  TRAVELER_DEPARTURE_COUNTRIES,
  TRAVELER_ARRIVAL_COUNTRIES,
} from '../config/supportedCountries';

const router = Router();

// Initialize repositories and service
const tripRepository = new TripRepository();
const userRepository = new UserRepository();
const tripService = new TripService(tripRepository, userRepository);

const createTripSchema = z.object({
  fromCountry: z.enum(TRAVELER_DEPARTURE_COUNTRIES),
  toCountry: z.enum(TRAVELER_ARRIVAL_COUNTRIES),
  departureDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  arrivalDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format (MM/dd/yyyy)'),
  arrivalTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  timezone: z.string().refine(
    tz => {
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

const updateTicketPhotoSchema = z.object({
  ticketPhoto: z.string().url(),
});

const cancelTripSchema = z.object({
  reason: z.string().optional(),
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

    // Convert string ID to ObjectId
    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch {
      return res
        .status(400)
        .json({ error: 'Bad Request', message: 'Invalid user ID' });
    }

    // Get user's trips
    const trips = await tripService.getTravelerTrips(userObjectId);

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
        timezone: trip.timezone,
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
  return;
});

/**
 * @route POST /api/trips
 * @desc Create a new trip
 * @access Private (Traveler only)
 */
router.post(
  '/',
  requireAuth,
  authorizeRoles('traveler'),
  async (req, res, next) => {
    try {
      // Zod parsing will throw if invalid; middleware will catch it
      const tripData = createTripSchema.parse(req.body);

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Convert string ID to ObjectId
      let userObjectId: mongoose.Types.ObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Prepare data for service
      const serviceData = {
        fromCountry: tripData.fromCountry,
        toCountry: tripData.toCountry,
        departureDate: tripData.departureDate,
        departureTime: tripData.departureTime,
        arrivalDate: tripData.arrivalDate,
        arrivalTime: tripData.arrivalTime,
        timezone: tripData.timezone,
        availableCarryOnKg: tripData.availableCarryOnKg,
        availableCheckedKg: tripData.availableCheckedKg,
        ticketPhoto: tripData.ticketPhoto,
        canCarryFragile: tripData.canCarryFragile,
        canHandleSpecialDelivery: tripData.canHandleSpecialDelivery,
      };

      // Service will throw ValidationError/NotFoundError if needed; middleware will catch it
      const trip = await tripService.createTrip(userObjectId, serviceData);

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
      // Pass to error middleware
      next(error);
      return;
    }
  }
);

/**
 * @route PUT /api/trips/:tripId/ticket-photo
 * @desc Update ticket photo for a trip
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/ticket-photo',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
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

      // Convert string IDs to ObjectIds
      let tripObjectId: mongoose.Types.ObjectId;
      let userObjectId: mongoose.Types.ObjectId;
      try {
        tripObjectId = new mongoose.Types.ObjectId(tripId);
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid ID' });
      }

      // Update the trip with the photo URL
      const updatedTrip = await tripService.updateTrip(
        tripObjectId,
        userObjectId,
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
    return;
  }
);

/**
 * @route PUT /api/trips/:tripId/activate
 * @desc Activate a pending trip (start accepting bookings)
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/activate',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (!mongoose.isValidObjectId(tripId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid trip ID' });
      }

      if (!mongoose.isValidObjectId(userId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Convert string IDs to ObjectIds
      const tripObjectId = new mongoose.Types.ObjectId(tripId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const trip = await tripService.activateTrip(tripObjectId, userObjectId);
      if (!trip) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Trip not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Trip activated successfully',
        data: { id: trip._id, status: trip.status },
      });
    } catch (error) {
      console.error('Error activating trip:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to activate trip',
      });
    }
    return;
  }
);

/**
 * @route PUT /api/trips/:tripId/cancel
 * @desc Cancel a pending trip
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/cancel',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const { reason } = cancelTripSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (!mongoose.isValidObjectId(tripId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid trip ID' });
      }

      if (!mongoose.isValidObjectId(userId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Convert string IDs to ObjectIds
      const tripObjectId = new mongoose.Types.ObjectId(tripId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const trip = await tripService.cancelTrip(
        tripObjectId,
        userObjectId,
        reason
      );
      if (!trip) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Trip not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Trip cancelled successfully',
        data: { id: trip._id, status: trip.status },
      });
    } catch (error) {
      console.error('Error cancelling trip:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.issues,
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cancel trip',
      });
    }
    return;
  }
);

/**
 * @route PUT /api/trips/:tripId/mark-airborne
 * @desc Mark trip as airborne (manual activation)
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/mark-airborne',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (!mongoose.isValidObjectId(tripId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid trip ID' });
      }

      if (!mongoose.isValidObjectId(userId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Convert string IDs to ObjectIds
      const tripObjectId = new mongoose.Types.ObjectId(tripId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const trip = await tripService.markAirborne(tripObjectId, userObjectId);
      if (!trip) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Trip not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Trip marked as airborne',
        data: { id: trip._id, status: trip.status },
      });
    } catch (error) {
      console.error('Error marking trip airborne:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark trip airborne',
      });
    }
    return;
  }
);

/**
 * @route PUT /api/trips/:tripId/mark-arrived
 * @desc Mark trip as arrived
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/mark-arrived',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (!mongoose.isValidObjectId(tripId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid trip ID' });
      }

      if (!mongoose.isValidObjectId(userId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Convert string IDs to ObjectIds
      const tripObjectId = new mongoose.Types.ObjectId(tripId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const trip = await tripService.markArrived(tripObjectId, userObjectId);
      if (!trip) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Trip not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Trip marked as arrived',
        data: { id: trip._id, arrivedAt: trip.arrivedAt },
      });
    } catch (error) {
      console.error('Error marking trip arrived:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark trip arrived',
      });
    }
    return;
  }
);

/**
 * @route PUT /api/trips/:tripId/complete
 * @desc Complete a trip
 * @access Private (Traveler only)
 */
router.put(
  '/:tripId/complete',
  requireAuth,
  authorizeRoles('traveler'),
  validateParams(commonSchemas.tripId),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (!mongoose.isValidObjectId(tripId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid trip ID' });
      }

      if (!mongoose.isValidObjectId(userId)) {
        return res
          .status(400)
          .json({ error: 'Bad Request', message: 'Invalid user ID' });
      }

      // Convert string IDs to ObjectIds
      const tripObjectId = new mongoose.Types.ObjectId(tripId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const trip = await tripService.completeTrip(tripObjectId, userObjectId);
      if (!trip) {
        return res
          .status(404)
          .json({ error: 'Not found', message: 'Trip not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Trip completed successfully',
        data: { id: trip._id, status: trip.status },
      });
    } catch (error) {
      console.error('Error completing trip:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to complete trip',
      });
    }
    return;
  }
);

export default router;
