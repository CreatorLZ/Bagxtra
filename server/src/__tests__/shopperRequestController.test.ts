import request from 'supertest';
import express from 'express';
import { getShopperRequest } from '../controllers/shopperRequestController';
import { User } from '../models/User';
import { ShopperRequest } from '../models/ShopperRequest';
import '../server.ts'; // Ensure server is initialized for tests

describe('ShopperRequest Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a test app
    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.get('/shopper-requests/:id', getShopperRequest);
  });

  describe('getShopperRequest', () => {
    it('should return shopper request for the owner', async () => {
      // Create test user
      const owner = new User({
        clerkId: 'owner-clerk-id',
        fullName: 'Owner User',
        email: 'owner@example.com',
        role: 'shopper',
      });
      await owner.save();

      // Create test shopper request
      const shopperRequest = new ShopperRequest({
        shopperId: owner._id,
        destinationCountry: 'Test Country',
        status: 'draft',
        bagItems: [],
        priceSummary: {
          totalItemCost: 100,
          deliveryFee: 10,
          serviceFee: 5,
          tax: 15.5,
        },
        paymentStatus: 'pending',
      });
      await shopperRequest.save();

      const response = await request(app)
        .get(`/shopper-requests/${shopperRequest._id}`)
        .set('user', JSON.stringify({ id: owner._id.toString() }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(shopperRequest._id.toString());
      expect(response.body.data.shopperId).toBe(owner._id.toString());
    });

    it('should return 403 for non-owner user', async () => {
      // Create owner user
      const owner = new User({
        clerkId: 'owner2-clerk-id',
        fullName: 'Owner2 User',
        email: 'owner2@example.com',
        role: 'shopper',
      });
      await owner.save();

      // Create other user
      const otherUser = new User({
        clerkId: 'other-clerk-id',
        fullName: 'Other User',
        email: 'other@example.com',
        role: 'shopper',
      });
      await otherUser.save();

      // Create test shopper request
      const shopperRequest = new ShopperRequest({
        shopperId: owner._id,
        destinationCountry: 'Test Country',
        status: 'draft',
        bagItems: [],
        priceSummary: {
          totalItemCost: 100,
          deliveryFee: 10,
          serviceFee: 5,
          tax: 15.5,
        },
        paymentStatus: 'pending',
      });
      await shopperRequest.save();

      const response = await request(app)
        .get(`/shopper-requests/${shopperRequest._id}`)
        .set('user', JSON.stringify({ id: otherUser._id.toString() }));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toBe('You can only view your own requests');
    });

    it('should return 401 if user not authenticated', async () => {
      const response = await request(app).get('/shopper-requests/some-id');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('User not authenticated');
    });

    it('should return 404 if shopper request not found', async () => {
      const user = new User({
        clerkId: 'user-clerk-id',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'shopper',
      });
      await user.save();

      const response = await request(app)
        .get('/shopper-requests/507f1f77bcf86cd799439011') // Valid ObjectId that doesn't exist
        .set('user', JSON.stringify({ id: user._id.toString() }));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toBe('Shopper request not found');
    });
  });
});