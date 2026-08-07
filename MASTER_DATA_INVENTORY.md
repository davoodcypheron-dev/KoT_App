# KoT App Master Data Inventory & Entity Definitions

## Overview
**Total Entities**: 20
- **Master Data**: 16 (static reference data)
- **Transaction Data**: 4 (dynamic operational data)

---

## MASTER DATA ENTITIES

### 1. CUSTOMERS (Consumer Management)
**Purpose**: Store customer/guest profiles  
**Management**: ConfigPage → EntityManagerModal OR OrdersListPage

**Properties**:
```javascript
{
  id: string (e.g., "C1"),
  name: string (required),
  mobile: string (10 digits),
  address: string,
  regNo: string (registration number),
  createdAt: datetime,
  updatedAt: datetime
}
```
**Sample Data**: 10 records (John Doe, Sarah Smith, etc.)

---

### 2. DELIVERY_AGENTS (Courier Management)
**Purpose**: Store delivery personnel for order fulfillment  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "DA1"),
  name: string (required),
  mobile: string (10 digits),
  vahanNo: string (vehicle registration)
}
```
**Sample Data**: 9 records (Anil Das, Arjun Singh, etc.)

---

### 3. USERS (Login Accounts)
**Purpose**: Authentication & access control for staff  
**Management**: ConfigPage → EntityManagerModal (CRITICAL)

**Properties**:
```javascript
{
  id: string (e.g., "U1"),
  user: string (username, required, unique),
  pass: string (MUST BE HASHED in backend),
  role: string enum["Admin", "Manager", "User"],
  kotRateEditable: boolean,
  allowOpenItemSettle: boolean,
  waiterId: string (optional, reference to waiter),
  createdAt: datetime,
  updatedAt: datetime
}
```
**Sample Data**: 4 records (Admin, Manager, Cashier, User)
**Security**: Passwords must NEVER be stored in plain text

---

### 4. AUTH_USERS (Authorization Policies)
**Purpose**: Authorization rules per user  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (references Users.id),
  cancelKot: boolean (can cancel KOT?)
}
```
**Sample Data**: 2 records

---

### 5. WAITERS (Service Staff)
**Purpose**: Service personnel management  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "WT1"),
  name: string (required),
  pass: string (optional PIN, required),
  isAllowedKotCancel: boolean
}
```
**Sample Data**: 13 records (Anil Das, Sanjay Kumar, etc. - Cricket players!)

---

### 6. ORGANIZERS (Menu Sections)
**Purpose**: Quick-access menu sections  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "O1"),
  name: string (e.g., "TODAY'S SPECIALS"),
  items: array<string> (item IDs)
}
```
**Sample Data**: 4 records (Today's Specials, Fast Moving, Breakfast, Chef Recommendation)

---

### 7. GROUPS (Item Categories)
**Purpose**: Menu item categorization  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "G1"),
  name: string (required, e.g., "STARTERS (VEG)")
}
```
**Sample Data**: 8 records (Starters Veg, Starters Non-Veg, Breads, Rice, Curries, Hot Beverages, Cold Beverages, Ice Creams)

---

### 8. UNITS (Measurement Units)
**Purpose**: Quantity measurement standards  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "U-PCS"),
  name: string (e.g., "Pieces"),
  decimals: number (precision for fractional quantities)
}
```
**Sample Data**: 5 records (Pieces, Plate, Kilograms, Liters, Portion)

---

### 9. ITEMS (Menu Items) ⭐ CRITICAL
**Purpose**: Restaurant menu products with pricing  
**Management**: ProductChoiceMaster.jsx OR ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "I1"),
  name: string (required, e.g., "Paneer Tikka"),
  arName: string (Arabic name, optional),
  price: decimal (base price),
  groupId: string (reference to Groups.id),
  dietType: enum["veg", "non-veg", "egg"],
  unitId: string (reference to Units.id),
  openItem: boolean (can price be changed?),
  image: string URL,
  isActive: boolean (for soft delete)
}
```
**Sample Data**: 50+ records (extensive menu: starters, mains, breads, rice, curries, beverages, ice creams)
**Note**: Menu is multilingual (English + Arabic)

---

### 10. FLOORS (Restaurant Layout)
**Purpose**: Restaurant floor/area divisions  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "F1"),
  name: string (e.g., "Ground Floor"),
  description: string (optional)
}
```
**Sample Data**: To be defined

---

### 11. TABLES (Seating) ⭐ HIGH PRIORITY
**Purpose**: Physical table management for dine-in  
**Management**: TablesPage.jsx OR ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "T1"),
  name: string (table number/name),
  floorId: string (reference to Floors.id),
  capacity: number (seating capacity),
  status: enum["vacant", "occupied", "reserved"],
  type: string enum["DI"], // Dine-In only
  x: number (optional, for visual layout),
  y: number (optional, for visual layout)
}
```
**Sample Data**: To be defined

---

### 12. COOKING_INSTRUCTIONS (Special Requests)
**Purpose**: Predefined cooking instructions/notes  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "CI1"),
  name: string (e.g., "Extra Spicy", "No Garlic", "Half Cooked"),
  description: string
}
```
**Sample Data**: To be defined

---

### 13. LEDGERS (Accounting Heads)
**Purpose**: Accounting/settlement ledger accounts  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "L1"),
  name: string (e.g., "Cash", "Bank", "Credit Card"),
  type: enum["ASSET", "LIABILITY", "INCOME", "EXPENSE"],
  balance: decimal (current balance)
}
```
**Sample Data**: To be defined

---

### 14. PAYMENT_METHODS (Payment Types)
**Purpose**: Accepted payment modes  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "PM1"),
  name: string (e.g., "Cash", "Card", "UPI", "Check"),
  ledgerId: string (reference to Ledgers.id),
  description: string (optional)
}
```
**Sample Data**: To be defined

---

### 15. MULTI_PAY_TYPES (Split Payment Configs)
**Purpose**: Rules for splitting payments across methods  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "MPT1"),
  name: string (e.g., "50-50 Cash-Card"),
  type: string,
  config: object (payment split rules)
}
```
**Sample Data**: To be defined

---

### 16. OFFERS (Promotions & Discounts)
**Purpose**: Promotional campaigns and discount rules  
**Management**: ConfigPage → EntityManagerModal

**Properties**:
```javascript
{
  id: string (e.g., "OFF1"),
  name: string (e.g., "Happy Hour 50% Off"),
  type: enum["PERCENTAGE", "FLAT", "BUY_X_GET_Y"],
  value: decimal (discount amount or percentage),
  applicableItems: array<string> (item IDs or null for all),
  validFrom: datetime,
  validTo: datetime,
  isActive: boolean
}
```
**Sample Data**: To be defined

---

## TRANSACTION DATA ENTITIES

### 17. ORDERS ⭐ CRITICAL
**Purpose**: Customer order records  
**Management**: KotPage.jsx, OrdersListPage.jsx

**Properties**:
```javascript
{
  id: string (UUID, e.g., "ORD-20260714-001"),
  billNo: number (sequential),
  kotNo: number (kitchen order ticket number),
  tableId: string (optional, null for takeaway/delivery),
  customerId: string (reference to Customers.id, optional),
  type: enum["DI", "TA", "DE"], // Dine-In, TakeAway, Delivery
  pax: number (number of guests, 0 for non-dine-in),
  status: enum["DRAFT", "CONFIRMED", "IN_KITCHEN", "READY", "SERVED", "BILLED", "SETTLED", "CANCELLED"],
  totalAmount: decimal (before tax),
  taxAmount: decimal (calculated),
  discountAmount: decimal,
  settledAmount: decimal,
  notes: string (special instructions),
  waiterId: string (reference to Waiters.id),
  deliveryAgentId: string (reference to DeliveryAgents.id, if type=DE),
  createdAt: datetime,
  updatedAt: datetime,
  settledAt: datetime (optional)
}
```

---

### 18. ORDER_ITEMS (Line Items)
**Purpose**: Individual items in an order  
**Management**: Internal to order processing

**Properties**:
```javascript
{
  id: string (UUID),
  orderId: string (reference to Orders.id),
  itemId: string (reference to Items.id),
  quantity: number,
  rate: decimal (price per unit at time of order),
  itemTotal: decimal (quantity × rate),
  status: enum["DRAFT", "CONFIRMED", "IN_KITCHEN", "READY", "SERVED", "CANCELLED"],
  cookingInstructions: string,
  createdAt: datetime,
  updatedAt: datetime
}
```

---

### 19. ORDER_ITEM_ADDONS (Add-ons/Extras)
**Purpose**: Additional items/modifiers per line item  
**Management**: Internal to order processing

**Properties**:
```javascript
{
  id: string (UUID),
  orderItemId: string (reference to OrderItems.id),
  addonItemId: string (reference to Items.id, addon item),
  quantity: number,
  rate: decimal,
  addonTotal: decimal
}
```

---

### 20. BOOKINGS (Reservations)
**Purpose**: Table reservation management  
**Management**: BookingsPage.jsx

**Properties**:
```javascript
{
  id: string (UUID),
  customerId: string (reference to Customers.id),
  tableId: string (reference to Tables.id, optional - can book general),
  reservationTime: datetime (when the reservation is for),
  pax: number (party size),
  status: enum["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"],
  notes: string,
  bookingReference: string (for customer reference),
  createdAt: datetime,
  updatedAt: datetime
}
```

---

## SUPPORTING SYSTEM TABLES (NOT IN APP YET)

### 21. USER_SESSIONS (Authentication)
**Purpose**: Track active login sessions  
**Management**: Backend system

**Properties**:
```javascript
{
  id: string (UUID),
  userId: string (reference to Users.id),
  token: string (JWT token),
  loginAt: datetime,
  expiresAt: datetime,
  ipAddress: string,
  userAgent: string
}
```

---

### 22. AUDIT_LOG (Compliance)
**Purpose**: Track all data modifications  
**Management**: Backend automatic logging

**Properties**:
```javascript
{
  id: number (auto-increment),
  userId: string,
  entityType: string (table name),
  entityId: string,
  action: enum["CREATE", "UPDATE", "DELETE"],
  oldValue: JSON string,
  newValue: JSON string,
  timestamp: datetime,
  ipAddress: string
}
```

---

## DATA RELATIONSHIPS DIAGRAM

```
USERS ──┬─→ AUTH_USERS (1:1 auth policies)
        └─→ WAITERS (optional, one waiter per user)

CUSTOMERS ──┐
            ├─→ ORDERS
DELIVERY_AGENTS ─→ ORDERS
WAITERS ────────→ ORDERS
TABLES ──────────→ ORDERS

ORGANIZERS ──┐
GROUPS ──────┼─→ ITEMS
UNITS ───────┤
             └─→ ORDER_ITEMS

ITEMS ──┐
ADDONS ─┼─→ ORDER_ITEM_ADDONS
        └─→ ORDER_ITEMS

COOKING_INSTRUCTIONS → ORDER_ITEMS

PAYMENT_METHODS ──┐
LEDGERS ──────────┼─→ (Settlement)
MULTI_PAY_TYPES ──┘

OFFERS → ITEMS (promotion rules)

CUSTOMERS ─→ BOOKINGS ←─ TABLES

ORDERS ─→ ORDER_ITEMS ─→ ORDER_ITEM_ADDONS
```

---

## Master Data Sync Strategy

### Initial Load (First Time)
```
meta_data.js hardcoded values 
    ↓
dbInitializer.js seeds IndexedDB 
    ↓
mockDb.js loads into memory 
    ↓
React context/components read from memory
```

### MSSQL Integration (After Backend)
```
React API Client 
    ↓
Express API endpoints 
    ↓
MSSQL database 
    ↓
Response back to React 
    ↓
LocalStorage cache (optional) 
    ↓
React context updates
```

---

## Master Data Update Frequency

| Entity | Frequency | Who | Sensitive |
|--------|-----------|-----|-----------|
| CUSTOMERS | Daily | Admin/Cashier | NO |
| DELIVERY_AGENTS | Weekly | Admin | NO |
| USERS | Weekly | Admin | **YES** (password) |
| AUTH_USERS | Monthly | Admin | **YES** (permissions) |
| WAITERS | Weekly | Admin | NO |
| ORGANIZERS | Daily | Manager | NO |
| GROUPS | Monthly | Admin | NO |
| UNITS | Rarely | Admin | NO |
| ITEMS | Multiple/day | Manager | NO |
| FLOORS | Never | Admin | NO |
| TABLES | Rarely | Admin | NO |
| COOKING_INSTRUCTIONS | Monthly | Manager | NO |
| LEDGERS | Monthly | Accountant | **YES** (financial) |
| PAYMENT_METHODS | Monthly | Admin | NO |
| MULTI_PAY_TYPES | Rarely | Admin | NO |
| OFFERS | Daily | Manager | NO |

---

## Complexity Assessment

### Simple (Easy to Migrate)
- Units
- Groups
- Cooking Instructions
- Floors
- Ledgers
- Payment Methods
- Multi-Pay Types

### Medium (Standard CRUD)
- Customers
- Delivery Agents
- Waiters
- Organizers
- Offers
- Tables

### Complex (Business Logic Required)
- **USERS** - Password hashing, role validation
- **AUTH_USERS** - Permission matrix
- **ITEMS** - Image storage, variants, addons mapping
- **ORDERS** - Status workflow, calculations
- **ORDER_ITEMS** - Relationship complexity
- **ORDER_ITEM_ADDONS** - Nested data
- **BOOKINGS** - Availability checking, conflicts

---

**Last Updated**: 2026-07-14
**Status**: Ready for backend schema creation
