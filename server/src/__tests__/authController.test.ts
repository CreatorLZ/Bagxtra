import request from 'supertest';
import express from 'express';
import {
  registerUser,
  getCurrentUser,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  updateOwnRole,
} from '../controllers/authController';
import { User } from '../models/User';
import '../server.ts'; // Ensure server is initialized for tests

describe('Auth Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a test app
    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.post('/auth/register', registerUser);
    app.get('/auth/me', getCurrentUser);
    app.put('/auth/profile', updateUserProfile);
    app.get('/auth/users', getAllUsers);
    app.put('/auth/users/:userId/role', updateUserRole);
    app.put('/auth/role', updateOwnRole);
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        clerkId: 'test-clerk-id',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'shopper' as const,
        phone: '+1234567890',
        country: 'Test Country',
        profileImage: 'https://example.com/image.jpg',
      };

      // Mock Clerk webhook verification
      const mockWebhookEvent = {
        type: 'user.created',
        data: {
          id: userData.clerkId,
          first_name: 'Test',
          last_name: 'User',
          email_addresses: [{ email_address: userData.email }],
          phone_numbers: [{ phone_number: userData.phone }],
          image_url: userData.profileImage,
          unsafe_metadata: { role: userData.role },
        },
      };

      // Mock verifyWebhook function
      jest.mock('@clerk/express/webhooks', () => ({
        verifyWebhook: jest.fn().mockResolvedValue(mockWebhookEvent),
      }));

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
    });

    it('should return 409 if user already exists', async () => {
      // First create a user
      const existingUser = new User({
        clerkId: 'existing-clerk-id',
        fullName: 'Existing User',
        email: 'existing@example.com',
        role: 'shopper',
      });
      await existingUser.save();

      // Mock webhook for existing user
      const mockWebhookEvent = {
        type: 'user.created',
        data: {
          id: 'existing-clerk-id',
          first_name: 'Existing',
          last_name: 'User',
          email_addresses: [{ email_address: 'existing@example.com' }],
          unsafe_metadata: { role: 'shopper' },
        },
      };

      jest.mock('@clerk/express/webhooks', () => ({
        verifyWebhook: jest.fn().mockResolvedValue(mockWebhookEvent),
      }));

      const response = await request(app).post('/auth/register').send({});

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists');
    });

    it('should default to shopper role if invalid role in metadata', async () => {
      const mockWebhookEvent = {
        type: 'user.created',
        data: {
          id: 'invalid-role-clerk-id',
          first_name: 'Invalid',
          last_name: 'Role',
          email_addresses: [{ email_address: 'invalid@example.com' }],
          unsafe_metadata: { role: 'invalid-role' },
        },
      };

      jest.mock('@clerk/express/webhooks', () => ({
        verifyWebhook: jest.fn().mockResolvedValue(mockWebhookEvent),
      }));

      const response = await request(app).post('/auth/register').send({});

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('shopper');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user information', async () => {
      const user = new User({
        clerkId: 'current-user-clerk-id',
        fullName: 'Current User',
        email: 'current@example.com',
        role: 'shopper',
      });
      await user.save();

      const response = await request(app)
        .get('/auth/me')
        .set('user', JSON.stringify(user));

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(user.email);
    });

    it('should return 401 if user not authenticated', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User not authenticated');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = new User({
        clerkId: 'profile-update-clerk-id',
        fullName: 'Profile Update User',
        email: 'profile@example.com',
        role: 'shopper',
      });
      await user.save();

      const updateData = {
        fullName: 'Updated Name',
        phone: '+0987654321',
        country: 'Updated Country',
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('user', JSON.stringify(user))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.fullName).toBe(updateData.fullName);
      expect(response.body.user.phone).toBe(updateData.phone);
    });

    it('should return 401 if user not authenticated', async () => {
      const response = await request(app)
        .put('/auth/profile')
        .send({ fullName: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users for admin', async () => {
      const adminUser = new User({
        clerkId: 'admin-clerk-id',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });
      await adminUser.save();

      const regularUser = new User({
        clerkId: 'regular-clerk-id',
        fullName: 'Regular User',
        email: 'regular@example.com',
        role: 'shopper',
      });
      await regularUser.save();

      const response = await request(app)
        .get('/auth/users')
        .set('user', JSON.stringify(adminUser));

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 403 for non-admin users', async () => {
      const regularUser = new User({
        clerkId: 'non-admin-clerk-id',
        fullName: 'Non Admin User',
        email: 'nonadmin@example.com',
        role: 'shopper',
      });
      await regularUser.save();

      const response = await request(app)
        .get('/auth/users')
        .set('user', JSON.stringify(regularUser));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Admin access required');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const adminUser = new User({
        clerkId: 'admin-role-clerk-id',
        fullName: 'Admin Role User',
        email: 'adminrole@example.com',
        role: 'admin',
      });
      await adminUser.save();

      const targetUser = new User({
        clerkId: 'target-clerk-id',
        fullName: 'Target User',
        email: 'target@example.com',
        role: 'shopper',
      });
      await targetUser.save();

      const response = await request(app)
        .put(`/auth/users/${targetUser._id}/role`)
        .set('user', JSON.stringify(adminUser))
        .send({ role: 'traveler' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User role updated successfully');
      expect(response.body.user.role).toBe('traveler');
    });

    it('should prevent admin from changing their own role', async () => {
      const adminUser = new User({
        clerkId: 'self-admin-clerk-id',
        fullName: 'Self Admin User',
        email: 'selfadmin@example.com',
        role: 'admin',
      });
      await adminUser.save();

      const response = await request(app)
        .put(`/auth/users/${adminUser._id}/role`)
        .set('user', JSON.stringify(adminUser))
        .send({ role: 'shopper' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Admins cannot modify their own role');
    });
  });

  describe('updateOwnRole', () => {
    it('should update own role successfully', async () => {
      const user = new User({
        clerkId: 'own-role-clerk-id',
        fullName: 'Own Role User',
        email: 'ownrole@example.com',
        role: 'shopper',
      });
      await user.save();

      const response = await request(app)
        .put('/auth/role')
        .set('user', JSON.stringify(user))
        .send({ role: 'traveler' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Role updated successfully');
      expect(response.body.user.role).toBe('traveler');
    });

    it('should prevent non-admin from assigning admin role', async () => {
      const user = new User({
        clerkId: 'non-admin-assign-clerk-id',
        fullName: 'Non Admin Assign User',
        email: 'nonadminassign@example.com',
        role: 'shopper',
      });
      await user.save();

      const response = await request(app)
        .put('/auth/role')
        .set('user', JSON.stringify(user))
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Users cannot assign themselves admin role'
      );
    });
  });
});
