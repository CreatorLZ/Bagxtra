import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOrders } from '../controllers/ordersController.js';

const router = Router();

/**
 * @route GET /api/orders
 * @desc Get orders for the current user (shopper or traveler)
 * @access Private
 */
router.get('/', requireAuth, getOrders);

export default router;