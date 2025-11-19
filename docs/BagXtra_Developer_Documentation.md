# BagXtra Enhanced Matching System - Developer Documentation

## System Architecture

### Overview
BagXtra is a full-stack travel delivery platform built with:
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **Validation**: Zod schemas
- **Architecture**: Service-Repository pattern

### Directory Structure
```
bagxtra/
├── client/                          # Next.js frontend
│   ├── app/                        # App router pages
│   ├── components/                 # React components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilities and configurations
│   └── types/                      # TypeScript type definitions
├── server/                         # Express.js backend
│   ├── src/
│   │   ├── config/                 # Configuration files
│   │   ├── controllers/            # Route controllers
│   │   ├── middleware/             # Express middleware
│   │   ├── models/                 # Mongoose models
│   │   ├── routes/                 # API route definitions
│   │   ├── services/               # Business logic services
│   │   └── utils/                  # Utility functions
│   └── package.json
└── docs/                          # Documentation
```

## Database Schema

### Trip Model (`server/src/models/Trip.ts`)
```typescript
interface ITrip {
  _id: ObjectId;
  travelerId: ObjectId;              // Reference to User
  fromCountry: string;               // Departure country
  toCountry: string;                 // Arrival country
  departureDate: Date;               // Flight departure
  departureTime: string;             // HH:mm format
  arrivalDate: Date;                 // Flight arrival
  arrivalTime: string;               // HH:mm format
  timezone: string;                  // IANA timezone
  availableCarryOnKg: number;        // Carry-on capacity
  availableCheckedKg: number;        // Checked baggage capacity
  ticketPhoto?: string;              // UploadThing URL
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  activatedAt?: Date;                // When trip became active
  arrivedAt?: Date;                  // Manual arrival mark
  completedAt?: Date;                // Auto/manual completion
  cancelledAt?: Date;                // Cancellation timestamp
  manuallyActivated?: boolean;       // Manual activation flag
  manuallyArrived?: boolean;         // Manual arrival flag
  ordersCount: number;               // Total orders assigned
  ordersDelivered: number;           // Successful deliveries
  hasIssues?: boolean;               // Issue flag
  issueReason?: string;              // Issue description
  cancellationReason?: string;       // Cancellation reason
  canCarryFragile: boolean;          // Fragile item capability
  canHandleSpecialDelivery: boolean; // Special delivery capability
  createdAt: Date;
  updatedAt: Date;
}
```

### ShopperRequest Model (`server/src/models/ShopperRequest.ts`)
```typescript
interface IShopperRequest {
  _id: ObjectId;
  shopperId: ObjectId;               // Reference to User
  bagItems: ObjectId[];              // References to BagItem
  destinationCountry: string;        // Delivery destination
  status: ShopperRequestStatus;      // See status enum below
  priceSummary: IPriceSummary;       // Calculated pricing
  paymentStatus: PaymentStatus;      // Payment state
  trackingNumber?: string;           // Shipping tracking
  transactionId?: string;            // Payment transaction ID
  refundId?: string;                 // Refund transaction ID
  refundAmount?: number;             // Refund amount
  refundReason?: string;             // Refund reason
  refundTimestamp?: Date;            // Refund timestamp
  createdAt: Date;
  updatedAt: Date;
  // Enhanced fields for matching system
  cooldownEndsAt?: Date;             // 24h after booking
  purchaseDeadline?: Date;           // 24h after cooldown
  cooldownProcessed: boolean;        // Cron job flag
  cancellationReason?: string;       // Cancellation details
}

type ShopperRequestStatus =
  | 'draft' | 'open' | 'matched' | 'on_hold'
  | 'purchase_pending' | 'purchased'
  | 'in_transit' | 'delivered' | 'completed'
  | 'disputed' | 'cancelled';

interface IPriceSummary {
  totalItemCost: number;     // Sum of all item prices
  deliveryFee: number;       // Platform delivery fee
  serviceFee: number;        // Platform service fee
  tax: number;              // Applicable taxes
}
```

### Match Model (`server/src/models/Match.ts`)
```typescript
interface IMatch {
  _id: ObjectId;
  requestId: ObjectId;               // Reference to ShopperRequest
  tripId: ObjectId;                  // Reference to Trip
  travelerId: ObjectId;              // Reference to User
  matchScore: number;                // 0-100 scoring
  assignedItems: ObjectId[];         // References to BagItem
  status: MatchStatus;               // Match lifecycle
  deliveryPin?: string;              // 5-digit verification code
  deliveryPinExpiresAt?: Date;       // PIN expiration
  deliveryPinGeneratedAt?: Date;     // PIN creation timestamp
  pinVerifiedAt?: Date;              // PIN verification timestamp
  deliveredToVendorAt?: Date;        // Vendor delivery timestamp
  createdAt: Date;
  updatedAt: Date;
}

enum MatchStatus {
  Pending = 'pending',     // Match created, awaiting claim
  Claimed = 'claimed',     // Traveler claimed match
  Approved = 'approved',   // Shopper approved claimed match
  Rejected = 'rejected',   // Match rejected by either party
  Completed = 'completed'  // Delivery verified and completed
}
```

### BagItem Model (`server/src/models/BagItem.ts`)
```typescript
interface IBagItem {
  _id: ObjectId;
  productName: string;               // Item name
  productLink: string;               // Purchase URL
  price: number;                     // Item price
  currency: string;                  // Currency code (USD, EUR, etc.)
  weightKg: number;                  // Item weight
  dimensions: {                      // Physical dimensions
    length: number;
    width: number;
    height: number;
  };
  quantity: number;                  // Quantity ordered
  isFragile: boolean;                // Fragile item flag
  photos: string[];                  // UploadThing URLs
  requiresSpecialDelivery: boolean;  // Special handling required
  specialDeliveryCategory?: string;  // Special delivery type
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Trip Management (`/api/trips`)
```
GET    /api/trips                    # Get traveler's trips
POST   /api/trips                    # Create new trip
PUT    /api/trips/:id/activate       # Activate pending trip
PUT    /api/trips/:id/cancel         # Cancel pending trip
PUT    /api/trips/:id/complete       # Complete active trip
PUT    /api/trips/:id/mark-airborne  # Manual activation
PUT    /api/trips/:id/mark-arrived   # Manual arrival
PUT    /api/trips/:id/ticket-photo   # Update ticket photo
```

### Shopper Request Management (`/api/shopper-requests`)
```
GET    /api/shopper-requests/my-requests    # Get shopper's requests
POST   /api/shopper-requests               # Create new request
PUT    /api/shopper-requests/:id/cancel    # Cancel request
GET    /api/shopper-requests/:id/matches   # Get matches for request
```

### Match Management (`/api/matches`)
```
POST   /api/matches/:id/claim        # Traveler claims match
POST   /api/matches/:id/approve      # Shopper approves match
POST   /api/matches/:id/cancel       # Cancel match (cooldown)
```

### Delivery Management (`/api/delivery`)
```
POST   /api/delivery/:matchId/generate-pin    # Generate delivery PIN
POST   /api/delivery/:matchId/verify-pin      # Verify delivery PIN
GET    /api/delivery/:matchId/status          # Get delivery status
POST   /api/delivery/:matchId/deliver-to-vendor # Mark delivered to vendor
POST   /api/delivery/:matchId/resend-pin      # Resend PIN
```

### Dashboard (`/api/dashboard`)
```
GET    /api/dashboard/traveler       # Traveler dashboard data
GET    /api/dashboard/shopper        # Shopper dashboard data
GET    /api/dashboard/vendor         # Vendor dashboard data
GET    /api/dashboard/admin          # Admin dashboard data
```

## Services Architecture

### Service-Repository Pattern
All business logic is separated into services that depend on repository interfaces for data access.

### Core Services

#### TripService (`server/src/services/TripService.ts`)
**Responsibilities**:
- Trip creation with validation
- Lead time enforcement (5+ days)
- Capacity management
- Status transitions
- Trip ownership verification

**Key Methods**:
```typescript
createTrip(travelerId, tripData)     # Create with validation
updateTrip(tripId, travelerId, updates) # Update with ownership check
activateTrip(tripId, travelerId)    # Manual activation
completeTrip(tripId, travelerId)    # Completion with validation
validateTripCapacity(tripId, weight, isCarryOn) # Capacity checks
```

#### MatchingService (`server/src/services/MatchingService.ts`)
**Responsibilities**:
- Intelligent trip-item matching
- Scoring algorithm implementation
- Capacity and capability validation
- Lead time filtering

**Key Methods**:
```typescript
findMatches(bagItems, criteria)     # Find matching trips
scoreTrip(trip, bagItems, totals, criteria) # Calculate match score
checkCapacity(trip, totalWeight)   # Capacity validation
validateMatchFeasibility(tripId, bagItems) # Pre-match validation
```

**Scoring Algorithm**:
```typescript
const score = 0;
// Perfect route match (+30)
if (trip.fromCountry === criteria.fromCountry &&
    trip.toCountry === criteria.toCountry) {
  score += 30;
}
// Capacity fit (+25 carry-on, +15 checked)
if (fitsCarryOn) score += 25;
else if (fitsChecked) score += 15;
// Arrival window (+20)
if (withinArrivalWindow) score += 20;
// Traveler rating (+10)
score += (travelerRating / maxRating) * 10;
// Fragile handling (+10)
if (hasFragile && trip.canCarryFragile) score += 10;
// Special delivery (+5)
if (hasSpecial && trip.canHandleSpecialDelivery) score += 5;
```

#### BookingService (`server/src/services/BookingService.ts`)
**Responsibilities**:
- Match lifecycle management
- Cooldown period handling
- Purchase deadline enforcement
- Status transition coordination

**Key Methods**:
```typescript
claimMatch(travelerId, claimData)         # Traveler claims match
approveMatch(shopperId, matchId)          # Shopper approves (starts cooldown)
cancelMatchDuringCooldown(userId, data)  # Cancel during 24h window
processExpiredCooldowns()                 # Cron: end cooldowns
processMissedPurchaseDeadlines()          # Cron: enforce deadlines
```

#### DeliveryService (`server/src/services/DeliveryService.ts`)
**Responsibilities**:
- PIN generation and verification
- Secure delivery handoff
- Delivery status tracking

**Key Methods**:
```typescript
generateVerificationPin(matchData, travelerId) # Create 5-digit PIN
verifyDeliveryPin(verificationData, shopperId) # Verify with timing-safe comparison
markAsDelivered(matchId, travelerId)           # Complete delivery
resendVerificationPin(matchId, travelerId)     # Regenerate PIN
```

#### PaymentService (`server/src/services/PaymentService.ts`)
**Responsibilities**:
- Escrow management (simulation)
- Payment distribution logic
- Refund processing

**Key Methods**:
```typescript
holdInEscrow(escrowData)           # Hold payment (simulation)
releaseFromEscrow(releaseData)     # Release to parties (simulation)
processRefund(matchId, amount, reason) # Process refunds (simulation)
getEscrowStatus(requestId)         # Check escrow state
calculateFees(amount)              # Fee distribution logic
```

#### NotificationService (`server/src/services/NotificationService.ts`)
**Responsibilities**:
- User communication (console logging)
- Email/SMS/push notification framework
- Automated alerts and reminders

**Key Methods**:
```typescript
sendNotification(notification)                    # Send single notification
sendBookingConfirmation(shopperId, travelerId, matchId, cooldownEndsAt)
sendPurchaseDeadlineReminder(travelerId, matchId, hoursRemaining)
sendDeliveryPinGenerated(travelerId, shopperId, matchId, pin, expiresAt)
sendDeliveryCompleted(travelerId, shopperId, matchId, amount)
```

## Business Rules & Configuration

### BusinessRules (`server/src/config/businessRules.ts`)
```typescript
export const BUSINESS_RULES = {
  leadTime: {
    minimumDaysBeforeDeparture: 5,        // Min days for trip creation
    bookingCutoffDays: 5,                 // Days before departure to stop bookings
    complexityModifiers: {
      highValueThreshold: 500,            // $500+ items
      highValueExtraDays: 1,              // Extra day for high-value
      multiItemThreshold: 3,              // 3+ items
      multiItemExtraDays: 1,              // Extra day for multi-item
      specializedCategoriesExtraDays: 1   // Extra day for special delivery
    }
  },
  cooldowns: {
    shopperPaymentCooldownHours: 24,      // Hours to cancel after booking
    travelerPurchaseWindowHours: 24,      // Hours to purchase after cooldown
    deliveryWindowHours: 24,              // Hours for delivery after arrival
    sendPurchaseReminderAtHoursRemaining: 4 // When to send reminders
  },
  payments: {
    platformFeePercentage: 0.10,          // 10% platform fee
    vendorFeePercentage: 0.05,            // 5% vendor fee
    travelerPercentage: 0.85              // 85% to traveler
  },
  delivery: {
    pinLength: 5,                         // 5-digit PINs
    pinExpirationHours: 24,               // PIN valid for 24 hours
    maxResendAttempts: 3                  // Max PIN regenerations
  }
};
```

## Cron Jobs & Automation

### Trip Status Transitions (`server/src/server.ts`)
```typescript
// Every minute - Trip status auto-transitions
cron.schedule('*/1 * * * *', async () => {
  // Pending → Active (departure time reached)
  await Trip.updateMany({
    status: 'pending',
    departureDate: { $lte: now },
    arrivalDate: { $gt: now }
  }, { status: 'active', activatedAt: now });

  // Active → Completed (arrival time reached + all orders delivered)
  const activeTrips = await Trip.find({
    status: 'active',
    arrivalDate: { $lte: now }
  });
  // Complex logic for completion checking...
});
```

### Booking System Automation
```typescript
// Every 5 minutes - Process expired cooldowns
cron.schedule('*/5 * * * *', async () => {
  const result = await bookingService.processExpiredCooldowns();
  console.log(`✅ Processed ${result.processed} expired cooldowns`);
});

// Every 10 minutes - Enforce purchase deadlines
cron.schedule('*/10 * * * *', async () => {
  const result = await bookingService.processMissedPurchaseDeadlines();
  console.log(`⚠️ Cancelled ${result.cancelled} requests due to missed deadlines`);
});
```

## Security Features

### PIN Security
- **Generation**: Cryptographically secure random 5-digit numbers
- **Storage**: Hashed in database (not plain text)
- **Verification**: Timing-safe string comparison prevents timing attacks
- **Expiration**: 24-hour validity window
- **Single-use**: PIN expires after successful verification

### Access Control
- **Role-based authorization**: `shopper`, `traveler`, `vendor`, `admin`
- **Route-level protection**: Middleware validates user roles
- **Ownership verification**: Users can only access their own data
- **ObjectId validation**: Prevents ID manipulation attacks

### Input Validation
- **Zod schemas**: Comprehensive input validation
- **Type safety**: Full TypeScript coverage
- **Sanitization**: No direct user input in database queries
- **Error handling**: No sensitive data in error responses

## Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (business rule violation)
- `422`: Unprocessable Entity (validation failed)
- `500`: Internal Server Error

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { /* Validation errors or additional context */ }
}
```

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "field": "departureDate",
        "message": "Departure date must be at least 5 days from now"
      }
    ]
  }
}
```

## Testing Strategy

### Unit Tests
- **Service methods**: Business logic validation
- **Model validations**: Schema constraints
- **Utility functions**: Date/time calculations, scoring algorithms
- **Repository methods**: Data access patterns

### Integration Tests
- **API endpoints**: Full request/response cycles
- **Database transactions**: Data consistency
- **Cross-service communication**: Service interactions
- **Cron job execution**: Automated processes

### End-to-End Tests
- **Complete user journeys**: Registration to delivery
- **Error scenarios**: Edge cases and failure modes
- **Performance testing**: Load and stress testing
- **Security testing**: Penetration testing and vulnerability assessment

## Deployment & DevOps

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/bagxtra

# Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Payments (Future)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Upload
UPLOADTHING_TOKEN=...

# Business Rules
MIN_DAYS_BEFORE_DEPARTURE=5
BOOKING_CUTOFF_DAYS=5
SHOPPER_COOLDOWN_HOURS=24
PURCHASE_WINDOW_HOURS=24
```

### Health Checks
```
GET /health
Response: {
  "status": "OK" | "Unhealthy",
  "timestamp": "ISO string",
  "uptime": number,
  "database": "connected" | "disconnected"
}
```

### Monitoring
- **Application logs**: Winston logging
- **Error tracking**: Sentry integration (future)
- **Performance monitoring**: Response times, error rates
- **Business metrics**: Order completion, user engagement

### Scaling Considerations
- **Database**: MongoDB sharding for horizontal scaling
- **Caching**: Redis for session and API response caching
- **CDN**: Static asset delivery
- **Load balancing**: Multiple application instances
- **Queue system**: Background job processing (future)

## Future Development Roadmap

### Phase 4: Enhanced User Experience
- **Email Integration**: SendGrid/Mailgun for transactional emails
- **SMS Notifications**: Twilio for SMS alerts
- **Push Notifications**: Firebase for mobile push
- **Analytics Dashboard**: Business intelligence and reporting
- **Admin Panel**: User management and system monitoring

### Phase 5: Advanced Features
- **Dynamic Lead Times**: AI-based lead time optimization
- **ML Matching**: Machine learning enhanced matching
- **Multi-currency**: International payment support
- **Wallet System**: User balance management
- **Referral Program**: User acquisition incentives

### Payment Integration
- **Stripe Connect**: Real escrow functionality
- **PayPal Payouts**: International payment processing
- **Currency Conversion**: Real-time exchange rates
- **Payment Analytics**: Revenue tracking and reporting

### Mobile & PWA
- **Progressive Web App**: Installable mobile experience
- **Offline Support**: Core functionality without internet
- **Geolocation**: Location-based features
- **Camera Integration**: Photo uploads for receipts/PINs

## Troubleshooting Guide

### Common Issues

#### Matching Not Working
**Symptoms**: No trips found for valid requests
**Checks**:
- Verify lead time requirements (5+ days)
- Check trip availability and capacity
- Validate route matching logic
- Review scoring algorithm

#### Cooldown Not Processing
**Symptoms**: Requests stuck in 'on_hold' status
**Checks**:
- Verify cron job is running (`*/5 * * * *`)
- Check database connectivity
- Review cooldown calculation logic
- Monitor cron job logs

#### PIN Verification Failing
**Symptoms**: Valid PINs rejected
**Checks**:
- Verify PIN expiration (24 hours)
- Check timing-safe comparison implementation
- Review PIN storage and retrieval
- Validate PIN format (5 digits)

#### Payment Distribution Issues
**Symptoms**: Funds not released after delivery
**Checks**:
- Verify delivery PIN verification
- Check escrow status in simulation
- Review distribution calculations
- Monitor payment service logs

### Debug Commands
```bash
# Check system health
curl http://localhost:5000/health

# View active cron jobs
crontab -l

# Check MongoDB connection
mongosh --eval "db.stats()"

# View application logs
tail -f logs/application.log
```

### Performance Optimization
- **Database indexes**: Ensure proper indexing on frequently queried fields
- **API caching**: Implement Redis caching for expensive operations
- **Database optimization**: Use aggregation pipelines for complex queries
- **Background processing**: Move heavy operations to queue system

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Status**: MVP Complete - Production Ready