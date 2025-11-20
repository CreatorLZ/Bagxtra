# BagXtra Complete System Documentation

## Executive Summary

BagXtra is a peer-to-peer delivery platform that connects shoppers (people who want to buy items from international stores) with travelers (people flying internationally who have extra luggage space). Items are stored and picked up at vendor locations (accredited stores), and the entire platform is managed by admins.

## Core Concept

### The Problem
Shoppers in Nigeria want to buy items from international stores (Amazon, Zara, etc.) but shipping is expensive or unavailable.

### The Solution
Travelers flying into Nigeria have unused luggage space. BagXtra connects them:

- Shopper orders item from international store via BagXtra
- Traveler buys the item abroad and brings it in their luggage
- Traveler drops item at accredited vendor store in Nigeria
- Shopper picks up item from vendor using verification PIN
- Everyone gets paid

## User Roles & Functions

### 1. Shopper (Buyer/Customer)

**Primary Function**: Order items from international stores to be delivered by travelers

**Key Features**:
- Place orders with product details (URL, category, weight, fragility, etc.)
- Create "bags" (groups of items for same/different deliveries)
- Find travelers or receive proposals from travelers
- Match with travelers based on:
  - Travel route (departure → arrival cities)
  - Date ranges
  - Luggage space (carry-on vs check-in)
  - Fragile item capability
- Track orders through multiple states:
  - On Hold: 24hr cooldown period after payment (can cancel without penalty)
  - Purchase Pending: Traveler has 24hrs to buy the item
  - Item Purchased: Traveler bought the item
  - In Transit: Traveler is airborne/traveling
  - Arrived: Traveler landed, has 24hrs to drop off
  - Delivered: Item picked up by shopper
- Fund wallet, make payments via Stripe
- Rate travelers and open disputes
- Choose delivery method:
  - Someone picks up for them (provide pickup person details + photo)
  - Pick up themselves
- Choose drop-off method:
  - Vendor store pickup (using verification PIN)
  - Direct meet-up with traveler

**Wallet Behavior**:
- Can fund wallet (money held in Stripe)
- Money held in escrow until delivery complete
- Can withdraw ONLY if traveler hasn't purchased item yet
- Cannot withdraw after traveler purchases (money committed)

### 2. Traveler (Delivery Person)

**Primary Function**: Bring items from abroad in their luggage for shoppers

**Key Features**:
- Enter travel details:
  - Departure city, date, time
  - Arrival city, date, time
  - Available space (check-in weight, carry-on weight)
  - Can deliver fragile items? (Yes/No)
  - Can handle special deliveries? (Yes/No)
  - Upload ticket photo (optional, privacy-respecting)
- Browse available orders and send delivery proposals
- Get matched with shoppers based on compatibility
- Update order status at each stage:
  - "I have bought the item" (upload receipt)
  - "I am airborne" (about to depart)
  - "I have arrived at destination"
  - "I am at the store" (for vendor drop-off)
- Take quality assurance photos when dropping off at vendor
- Provide verification PIN to vendor for item storage
- Earn money from completed deliveries
- Withdraw any amount from wallet at any time
- View analytics (earnings by date range, trips, orders, disputes)
- Rate shoppers

**Travel Verification**:
- Must be approved by admin before delivering
- Upload government ID (NIN, driver's license, or passport)

### 3. Vendor (Accredited Store)

**Primary Function**: Store items dropped off by travelers and facilitate pickup by shoppers

**Key Features**:
- View incoming orders (items being dropped off)
- Verify items using verification PIN/code (5-digit code)
- Verify that:
  - Shopper's PIN matches system PIN
  - Item condition matches order request
- Approve item storage or open dispute
- Track orders:
  - Completed: Items picked up
  - Incoming: Items being dropped off today
- Earn commissions on every item stored/picked up
- Withdraw earnings
- View transaction history
- Manage business profile:
  - Store name, logo
  - Address, postal code
  - Registered business number
  - Bank account for payouts
- Chat with support

**Registration**:
- Provide business information and logo
- Pending verification by admin before activation

### 4. Admin (Platform Manager)

**Primary Function**: Oversee entire platform, manage users, handle disputes, set pricing

**Key Features**:

**Dashboard Metrics**:
- Total shoppers, travelers, vendors
- Total platform revenue
- Revenue vs Sales charts (filterable by date)
- Order status breakdown (delivered, canceled, pending, disputed)
- Recent orders list

**User Management**:
- Shoppers: View details, suspend, delete, download lists
- Travelers: View details, approve, suspend, remove, download lists
  - Must approve travelers before they can deliver
  - View uploaded government IDs
- Vendors: View details, approve, suspend, delete
  - Must approve vendors before they can receive items

**Order Management**:
- View all orders with full details:
  - Shopper, traveler, vendor info
  - Product details, photos, descriptions
  - Delivery information (store drop-off or direct)
  - Weights (check-in, carry-on)
  - Special delivery? Fragile item?
  - Amounts: item price, delivery fee, BagExtra commission
  - Reviews and ratings
- Filter orders by status, date, alphabetical order
- Remove reviews from public view if inappropriate

**Trip Management**:
- View all trips (pending, active, completed)
- See trip details: departure/arrival cities and dates

**Transaction Management**:
- View all financial transactions:
  - Total revenue
  - Escrow balance (money held for ongoing orders)
  - Total payouts (money sent to travelers/vendors)
  - Amounts in disputes (frozen until resolved)
- Transaction types:
  - Shopper funding account
  - Refunds
  - Payouts for delivery
  - Vendor commissions
- View/download transaction receipts

**Dispute Management**:
- View all disputes:
  - Total disputes, resolved, ongoing, unresolved
  - Dispute ID, who raised it, description, status, date
- View dispute details:
  - Traveler and shopper information
  - Full order details
  - Dispute form and attached evidence photos
  - Quality assurance photos from traveler
  - Chat history between parties
- Message traveler and shopper separately
- Resolve disputes by deciding:
  - Refund shopper? (full/partial)
  - Pay traveler? (full/partial)
  - Pay vendor? (if applicable)

**Pricing & Payment Structure**:
- Set payment structure by category (14+ categories):
  - Automotive & Travel Gear
  - Baby & Kids Essentials
  - Electronics
  - Toys & Gifts
  - Fashion
  - etc.
- For each category, set:
  - Base price: Default delivery fee for standard orders
  - Special rates: Custom pricing for specific conditions:
    - Item value tiers (< $100, > $100, etc.)
    - Weight ranges (check-in kg, carry-on kg)
    - Timing urgency (< 24hrs, 24-48hrs, > 48hrs)
    - Fragile items surcharge
    - Special delivery surcharge
    - Percentage deductions (if any)
- Add new product categories with descriptions
- Edit existing category pricing

**Discount Management**:
- Create promotional discounts:
  - Discount name (e.g., "December Promo")
  - Type: Percentage off OR fixed amount off
  - Start and end dates
  - Usage limit (e.g., first 20 users)
  - Short description
- View users who redeemed each discount
- Edit or remove active discounts

**Referral Program**:
- Set referral reward amount
- View total referrals, active referrals
- View total amounts disbursed for referrals
- See who referred whom and earnings per referrer

**Admin Roles & Permissions**:
- Five admin levels:
  - Admin
  - Super Admin
  - Operations Admin
  - Finance Admin
  - Vendor Admin
- Set granular permissions for each role:
  - Shopper Management (5 permissions)
  - Traveler Management (5 permissions)
  - Vendor Management
  - Order Management
  - Financial Management
  - Dispute Resolution
  - etc.
- Invite new admins (start as "Admin", can be promoted)
- Remove admin access

## Critical Business Logic

### Matching Algorithm

When finding travelers for shoppers, the system calculates a "match percentage" based on:

- Route compatibility: Traveler's departure city matches shopper's desired purchase location, arrival city matches shopper's delivery location
- Date compatibility: Traveler's dates fall within shopper's date range
- Space compatibility: Traveler has enough luggage space for items
- Fragile item handling:
  - If item is fragile, traveler MUST have carry-on space
  - Cannot match fragile items with travelers who only have check-in space
- Item capacity: Traveler can carry X out of Y items in shopper's bag

Example: "90% match - This person can only deliver 3 over 4 of the items in your bag and they will be in Nigeria four hours after your desired time frame."

### The "Bag" System

Shoppers can add multiple items to their order. They have two options:

**Same Bag**: All items delivered together by same traveler(s)
- One delivery time
- One delivery fee (typically)
- System finds traveler(s) who can carry all items
- If no single traveler can carry all, system offers multiple travelers

**Separate Bags**: Items delivered separately
- Different delivery times (shopper can set different date ranges)
- Separate delivery fees
- Useful when:
  - Need one item urgently, another can wait
  - Items too large for one traveler
  - Want flexibility in timing

If multiple travelers needed for one bag:
- System shows message: "Sorry, multiple travelers will be needed to deliver your item"
- Options:
  - Wait for perfect match (single traveler who can carry all)
  - Accept multiple travelers (shopper multi-selects from list)

### 24-Hour Cooldown Periods

**For Shoppers (after payment)**:
- 24-hour window to cancel order without full penalty
- After 24 hours, cannot cancel (traveler may have purchased item)
- Refunds after 24hrs subject to deductions

**For Travelers (after landing)**:
- 24-hour window to drop off item after arrival
- Can drop at vendor store or meet shopper directly

**For Travelers (after shopper payment)**:
- 24-hour window to purchase the item after shopper confirms (after initial 24hr shopper cooldown)

### Verification PIN System

5-digit code used to verify item drop-off and pickup:
- Traveler drops item at vendor store
- System generates 5-digit PIN
- Traveler shows PIN to vendor
- Shopper later shows same PIN to vendor
- Vendor verifies both PINs match before releasing item
- Prevents wrong item pickup, fraud

### Quality Assurance Photos

When traveler drops item at vendor:
- Must take photo of item in its current condition
- Photo timestamp and stored by system
- Used for dispute resolution:
  - If shopper claims item damaged on pickup
  - Admin compares QA photo vs shopper's dispute photo
  - Determines if damage happened at vendor or during travel

### Proposal System

Two ways shoppers and travelers connect:

**Option 1: Shopper finds traveler**
- Shopper enters delivery details
- Clicks "Find Traveler"
- System shows list of travelers with match percentages
- Shopper selects traveler and books

**Option 2: Traveler sends proposal**
- Shopper enters delivery details
- Clicks "Get proposals from travelers"
- Order posted publicly for travelers to browse
- Travelers view order and click "I'd like to deliver this item"
- Shopper receives notifications: "Olada and 2 others sent a delivery proposal"
- Shopper reviews traveler profiles and accepts one

### Payment Flow

Shopper pays → Money goes to escrow (Stripe)
24hr cooldown → Shopper can cancel, get refund
Traveler purchases → Traveler uploads receipt
Traveler travels → Updates status to "airborne"
Traveler lands → Updates status to "arrived"
Drop-off → Traveler drops at vendor or meets shopper
Pickup → Shopper picks up, verifies condition
Money released:
- Traveler gets delivery fee (minus BagExtra commission)
- Vendor gets commission (if store used)
- BagExtra keeps commission
If dispute opened: Money frozen until admin resolves

## Order States & Status Flow

### Shopper's View:
- Accepted: Traveler agreed to deliver, waiting for shopper payment
- Pending:Booking request sent to traveler. awaiting either confirmation or rejection
  - Purchase Pending (traveler buying item)
  - Item Purchased (traveler has item)
  - Incoming: Item arriving today (traveler landed or landing soon)
  - Completed: Item delivered and picked up
  - Disputed: Issue raised, admin reviewing

### Traveler's View:
- Accepted: Accepted request, waiting for shopper payment
- Pending: Shopper chose me, waiting for me to either accept or reject
- Outgoing: About to deliver or delivering today
- Completed: Item delivered
- Disputed: Issue raised

## Wallet System

### Shoppers:
- Fund wallet (Stripe)
- Money held in Stripe, UI shows balance
- Can withdraw ONLY if traveler hasn't purchased
- After traveler purchases, money committed (cannot withdraw)

### Travelers:
- Earn from deliveries
- Can withdraw ANY AMOUNT at any time
- Not required to withdraw all (unlike shoppers)

### Vendors:
- Earn commissions per item stored
- Can withdraw anytime
- View transaction history

**Platform Design**: NOT a savings system. Money flows through, doesn't stay long-term.

## Browse Stores Feature

When shoppers place orders, they need product URLs. If they don't have one:
- Click "Browse Stores"
- See list of popular stores (Amazon, Zara, etc.) with icons
- Click store icon → Opens store in new tab
- Shopper copies product URL
- Returns to BagXtra and pastes URL in order form

## Category System

14+ product categories with custom icons:
- Automotive & Travel Gear
- Baby & Kids Essentials
- Electronics & Tech
- Toys & Gifts
- Fashion & Apparel
- Beauty & Personal Care
- Home & Garden
- Sports & Outdoors
- Books & Media
- Health & Wellness
- Pet Supplies
- Office Supplies
- Food & Beverages
- Other

Admins can add more categories as needed.

## Analytics & Reporting

### Travelers can view:
- Earnings by date range
- Total trips, completed trips, cancelled trips
- Items delivered, disputed items
- Wallet balance and transaction history

### Admins can view:
- Platform-wide revenue, users, trips, orders
- Revenue vs Sales (toggle view)
- Order status distribution
- All user activity and transactions
- Filter/download reports by date ranges

## Communication

### Within Platform:
- Shoppers can message travelers (only after traveler arrives)
- Admins can message anyone
- Vendors can chat with support

### External:
- Email notifications for key events
- No phone calls within app (by design, per transcript)

## Dispute Resolution

### Who can open disputes:
- Shoppers (item damaged, wrong item, not as described)
- Travelers (shopper didn't pick up, false claims)
- Vendors (verification issues, damaged items on drop-off)

### Dispute process:
- User opens dispute with description and evidence photos
- Dispute visible to admin with status: Pending Review / Resolving / Resolved
- Admin reviews all evidence:
  - Order details
  - Quality assurance photos
  - User-submitted photos
  - Chat history
- Admin messages both parties separately for clarification
- Admin decides resolution:
  - Full/partial refund to shopper
  - Full/partial payment to traveler
  - Vendor commission (if applicable)
- Status updated to "Resolved"
- Money handling: Disputed amounts frozen in escrow until resolution

## Key Design Decisions (from Transcripts)

- Mobile-first design adapted for web: Original designs were for native mobile app, being adapted for web application
- No localStorage/sessionStorage(this might be a wrong assumption the web has these): Not supported in artifact environment, must use React state or API calls
- Stripe payments only: Originally had PayStack option, removed to use only Stripe
- No conversion feature: Originally had wallet currency conversion (Naira ↔ Dollars), removed to avoid fintech regulations
- Quality over speed: Team spent 3+ months refining requirements to avoid scope changes during development
- PIN changed from 4 to 5 digits: Enhanced security for verification system

## Technical Considerations

### Authentication & Verification:
- Travelers must upload government ID for admin approval
- Vendors must provide business registration details
- All users go through verification before full platform access

### File Handling:
- Product photos (uploaded by shoppers)
- Receipts (uploaded by travelers)
- Quality assurance photos (taken by travelers at vendor)
- Government IDs (uploaded by travelers)
- Ticket photos (optional, uploaded by travelers)
- Dispute evidence photos (uploaded by anyone opening dispute)

### Real-time Updates:
- Order status changes
- Traveler location updates (airborne, arrived, at store)
- New proposals from travelers
- Dispute status changes
- Payment status changes

### Search & Filter:
- Shoppers: Find travelers by route, date, capacity
- Travelers: Browse orders by destination, date, item type
- Admins: Filter users/orders/transactions by multiple criteria
- Vendors: Search orders by traveler name, date

## MVP Timeline & Constraints

- Development started Nov 1st 2025
- Target completion: Before January 2025
- Current status: Building web version
- Solo developer (Isaac) adapting mobile designs for web
- Native mobile app: Planned after web MVP launches