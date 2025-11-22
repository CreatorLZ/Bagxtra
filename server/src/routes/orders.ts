import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOrders, getOrderDetails } from '../controllers/ordersController.js';
import { validateParams } from '../middleware/validation.js';
import { z } from 'zod';

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

const router = Router();

/**
 * @route GET /api/orders
 * @desc Get orders for the current user (shopper or traveler)
 * @access Private
 */
router.get('/', requireAuth, getOrders);

/**
 * @route GET /api/orders/:id
 * @desc Get detailed order information
 * @access Private (Shopper or Traveler involved in order)
 */
router.get('/:id', requireAuth, validateParams(idSchema), getOrderDetails);

export default router;