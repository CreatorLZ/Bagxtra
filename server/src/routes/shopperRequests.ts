import { Router } from 'express';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validation.js';
import {
  createShopperRequest,
  getMyShopperRequests,
  getShopperRequest,
  publishShopperRequest,
  cancelShopperRequest,
} from '../controllers/shopperRequestController.js';
import { z } from 'zod';
import mongoose from 'mongoose';

// Common ID schema for validation
const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

const router = Router();


/**
 * @route POST /api/shopper-requests
 * @desc Create a new shopper request
 * @access Private (Shopper only)
 */
router.post('/', requireAuth, authorizeRoles('shopper'), createShopperRequest);

/**
 * @route GET /api/shopper-requests/my-requests
 * @desc Get current shopper's requests
 * @access Private (Shopper only)
 */
router.get('/my-requests', requireAuth, authorizeRoles('shopper'), getMyShopperRequests);

/**
 * @route GET /api/shopper-requests/:id
 * @desc Get specific shopper request details
 * @access Private (Shopper only - own requests)
 */
router.get('/:id', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), getShopperRequest);

/**
 * @route PUT /api/shopper-requests/:id/publish
 * @desc Publish a draft shopper request (make it available for matching)
 * @access Private (Shopper only - own requests)
 */
router.put('/:id/publish', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), publishShopperRequest);

/**
 * @route PUT /api/shopper-requests/:id/cancel
 * @desc Cancel a shopper request
 * @access Private (Shopper only - own requests)
 */
router.put('/:id/cancel', requireAuth, authorizeRoles('shopper'), validateParams(idSchema), cancelShopperRequest);

export default router;