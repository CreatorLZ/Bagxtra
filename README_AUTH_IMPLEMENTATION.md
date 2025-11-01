# BagXtra Authentication Implementation

## Overview

This document outlines the complete Clerk-based authentication and user management system implemented for BagXtra, including setup instructions, API documentation, and testing guidelines.

## Features Implemented

✅ **Authentication Setup**

- Clerk integration for both client and server
- JWT-based session management
- OAuth and email/password authentication
- Secure token verification middleware

✅ **User Schema & Management**

- MongoDB/Mongoose schema with full TypeScript typing
- Role-based access control (Shopper, Traveler, Vendor, Admin)
- Input validation and sanitization
- Secure data handling

✅ **API Routes**

- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/update` - Update user profile
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/users` - Admin: List all users
- `PUT /api/auth/users/:userId/role` - Admin: Update user role

✅ **Client Integration**

- Next.js ClerkProvider setup
- Custom hooks: `useUser()` and `useRole()`
- Login/Register pages with shadcn components
- Password reset page
- Protected route components

✅ **Security Features**

- Input validation with Zod
- Data sanitization middleware
- Security event logging
- Role-based access control
- HTTPS-only API access

## Environment Variables

Update your `.env` file with the following variables:

```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
JWT_SECRET=your_jwt_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/bagxtra

# Other services
STRIPE_SECRET_KEY=sk_test_your_stripe_key
UPLOADTHING_SECRET=your_uploadthing_secret
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Installation & Setup

### 1. Install Dependencies

```bash
# Client dependencies
cd client
npm install @clerk/nextjs

# Server dependencies (already installed)
cd ../server
npm install zod joi
```

### 2. Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure authentication methods (Email + Password, OAuth providers)
3. Copy publishable and secret keys to your `.env` file
4. Configure webhook endpoints for user registration (optional)

### 3. Database Setup

Ensure MongoDB is running and the connection string is set in `MONGODB_URI`.

## API Testing

### Registration (via Clerk Webhook)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_clerk_id_here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "shopper",
    "phone": "+1234567890",
    "country": "USA"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/update \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "phone": "+1987654321"
  }'
```

### Admin: List Users

```bash
curl -X GET "http://localhost:5000/api/auth/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Admin: Update User Role

```bash
curl -X PUT http://localhost:5000/api/auth/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "vendor"}'
```

## Client Usage Examples

### Using Authentication Hooks

```tsx
import { useUser, useRole } from '@/hooks';

function Dashboard() {
  const { user, isLoading, isAuthenticated } = useUser();
  const { hasRole, isAdmin, canAccessVendor } = useRole();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user?.fullName}!</h1>
      <p>Role: {user?.role}</p>
      {isAdmin() && <div>Admin Panel Access</div>}
      {canAccessVendor() && <div>Vendor Features</div>}
    </div>
  );
}
```

### Protected Routes

```tsx
// Example Next.js protected route pattern (lib/auth/ProtectedRoute.tsx)
import { redirect } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export async function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) redirect('/auth/login');

  return <>{children}</>;
}

// Usage in app/dashboard/page.tsx
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

## Security Logging

The system logs all authentication events:

- Authentication successes/failures
- Unauthorized access attempts
- Forbidden access attempts
- User registration/updates
- Role changes

Logs are available via the SecurityLogger instance:

```typescript
import { securityLogger } from './middleware/securityLogger';

// Get recent events
const events = securityLogger.getRecentEvents(50);

// Get events for specific user
const userEvents = securityLogger.getEventsForUser('user_id');
```

## File Structure

```
server/src/
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── validation.ts        # Input validation & sanitization
│   └── securityLogger.ts    # Security event logging
├── models/
│   └── User.ts              # User Mongoose schema
├── controllers/
│   └── authController.ts    # Authentication controllers
├── routes/
│   └── auth.ts              # Authentication routes
└── server.ts                # Main server file

client/
├── app/
│   ├── layout.tsx           # ClerkProvider setup
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
├── hooks/
│   ├── useUser.ts           # User data hook
│   └── useRole.ts           # Role management hook
└── lib/auth/
    ├── types.ts             # TypeScript types
    ├── ProtectedRoute.tsx   # Route protection components
    └── rbac.ts              # Role-based access control
```

## Testing Checklist

- [ ] User registration via Clerk
- [ ] JWT token verification
- [ ] Role-based route protection
- [ ] Profile updates
- [ ] Admin user management
- [ ] Security event logging
- [ ] Input validation and sanitization
- [ ] Error handling for invalid tokens
- [ ] Client-side authentication state management

## Troubleshooting

### Common Issues

1. **Clerk token verification fails**

   - Ensure `CLERK_SECRET_KEY` is set correctly
   - Check token format (should start with "Bearer ")

2. **User not found after authentication**

   - Ensure user is registered in the database
   - Check Clerk webhook configuration

3. **Role-based access not working**

   - Verify user role in database
   - Check middleware order in routes

4. **Client hooks not updating**
   - Ensure ClerkProvider wraps the entire app
   - Check React Query cache settings

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=clerk:*
```

## Next Steps

1. Configure Clerk webhooks for automatic user registration
2. Implement password reset flow in Clerk dashboard
3. Add rate limiting for authentication endpoints
4. Set up monitoring for security events
5. Implement user session management
6. Add multi-factor authentication support

## Support

For issues related to Clerk authentication, refer to the [Clerk Documentation](https://docs.clerk.com).

For BagXtra-specific implementation details, check the inline code comments and TypeScript types.
