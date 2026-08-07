# KoT App - MSSQL Integration & Modernization Plan

## Executive Summary
Your app is currently a **full client-side (IndexedDB) application** with mock data. To integrate MSSQL, you need a backend API layer to handle all data persistence, authentication, and transaction management.

---

## Part 1: Current Architecture Analysis

### 1.1 Current Data Layer
**Status**: Pure IndexedDB (Browser-based)
- **Database**: IndexedDB (stored locally on browser)
- **State Management**: Context API + Memory cache (mockDb.js)
- **Data Flow**: Mock data → IDB → Memory → React Components

### 1.2 Master Data Inventory
**Total: 16 Master Tables** requiring MSSQL schema creation:

#### Category A: Entity Masters (13 tables)
1. **CUSTOMERS** - Customer profiles & registration
2. **DELIVERY_AGENTS** - Rider/delivery personnel
3. **USERS** - Staff login accounts  
4. **AUTH_USERS** - Authorization configurations
5. **WAITERS** - Service staff
6. **ORGANIZERS** - Quick menu sections
7. **GROUPS** - Menu item categories
8. **UNITS** - Measurement units (pcs, kg, ltr, etc.)
9. **ITEMS** - Menu items with pricing
10. **FLOORS** - Restaurant layout
11. **TABLES** - Dine-in seating
12. **COOKING_INSTRUCTIONS** - Special prep notes
13. **LEDGERS** - Accounting/payables
14. **PAYMENT_METHODS** - Payment types
15. **MULTI_PAY_TYPES** - Multi-payment configs
16. **OFFERS** - Discounts & promotions

#### Category B: Transaction Masters (4 tables)
- **ORDERS** - Customer orders
- **ORDER_ITEMS** - Order line items
- **ORDER_ITEM_ADDONS** - Add-ons per item
- **BOOKINGS** - Table reservations

---

## Part 2: Config Page Analysis

### 2.1 Current ConfigPage Structure
**Location**: [src/pages/ConfigPage.jsx](src/pages/ConfigPage.jsx)

The config page manages:
- **Basic Operations**: Restaurant name, tax rate, currency, default order type
- **Discount Controls**: Staff/Auth discount limits, discount-only mode
- **Identity & Search**: Quick search mode, post-order type changes
- **Policy Enforcement**: PAX mandatory, waiter mandatory, ledger settlement rules
- **Database Management**: 13 entity managers + factory reset

### 2.2 Master Data Management
ConfigPage provides access to 13 masters via **EntityManagerModal**:
- Staff & Users
- Waiters
- Delivery Agents
- Auth Configs
- Tables
- Floors
- Menu Groups
- Menu Items
- Payment Methods
- Multi-Pay Types
- Ledgers
- Cooking Instructions
- Units

---

## Part 3: Master Pages Inventory & Plan

### 3.1 Explicit Master Pages (6 pages)
| Page | File | Purpose | Needs Backend |
|------|------|---------|---------------|
| Addon Master | AddonMaster.jsx | Manage add-on items | YES |
| Item-Addon Link Master | ItemAddonMaster.jsx | Map items to add-ons | YES |
| Product Choice Master | ProductChoiceMaster.jsx | Product variants | YES |
| Bookings | BookingsPage.jsx | Reservation management | YES |
| Delivery Dashboard | DeliveryDashboard.jsx | Delivery tracking | YES |
| Tables | TablesPage.jsx | Table management | YES |

### 3.2 Implicit Masters (via EntityManagerModal in ConfigPage)
| Entity | Modal Component | Priority | Complexity |
|--------|-----------------|----------|-----------|
| Customers | EntityManagerModal | HIGH | Medium |
| Users | EntityManagerModal | CRITICAL | High |
| Waiters | EntityManagerModal | HIGH | Low |
| Delivery Agents | EntityManagerModal | MEDIUM | Low |
| Auth Users | EntityManagerModal | HIGH | High |
| Tables | EntityManagerModal | HIGH | Medium |
| Floors | EntityManagerModal | MEDIUM | Low |
| Menu Groups | EntityManagerModal | HIGH | Low |
| Menu Items | EntityManagerModal | CRITICAL | High |
| Payment Methods | EntityManagerModal | MEDIUM | Low |
| Cooking Instructions | EntityManagerModal | MEDIUM | Low |
| Units | EntityManagerModal | LOW | Low |
| Ledgers | EntityManagerModal | MEDIUM | Medium |
| Multi-Pay Types | EntityManagerModal | LOW | Low |
| Offers | EntityManagerModal | MEDIUM | Medium |

**Total: 19 Master Management UIs** (6 pages + 13 modals)

---

## Part 4: MSSQL Integration Strategy

### 4.1 Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Current)                 │
│  - Components, Pages, Modals unchanged                      │
│  - Hook into new API layer instead of IndexedDB             │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│            API Layer (NEW - Node.js/Express)                │
│  - REST/GraphQL endpoints for all masters & transactions    │
│  - Authentication & Authorization                          │
│  - Business logic & validation                              │
│  - Caching (optional: Redis)                                │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│         MSSQL Database (NEW)                                │
│  - 16 Master tables                                         │
│  - 4 Transaction tables                                     │
│  - Audit tables                                             │
│  - User sessions table                                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Transformation

**BEFORE (Current)**:
```
Mock Data → IndexedDB → Memory Cache → React Components
                           ↑
                      No persistence
```

**AFTER (With MSSQL)**:
```
React Components → API Client → Express API → MSSQL
     ↓                                          ↓
[LocalCache]         [Validation]         [Persistent]
     ↑                    ↑
     └────────────────────┘
       (Sync on demand)
```

---

## Part 5: Implementation Roadmap

### Phase 1: Backend Setup (Week 1-2)
**Deliverables**:
- Express.js server with basic routing
- MSSQL database schema creation
- Authentication middleware
- CRUD endpoints for all 16 masters

**Key Files to Create**:
```
backend/
├── server.js
├── config/
│   ├── database.js
│   └── environment.js
├── models/
│   ├── Customer.js
│   ├── User.js
│   ├── Item.js
│   ├── Order.js
│   └── ... (16 files total)
├── routes/
│   ├── auth.js
│   ├── customers.js
│   ├── items.js
│   ├── orders.js
│   └── ... (all master routes)
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
└── controllers/
    ├── customerController.js
    ├── userController.js
    └── ... (business logic)
```

### Phase 2: Frontend API Integration (Week 2-3)
**Affected Files**:
- Create `src/api/` folder with API client functions
- Update `AppContext.jsx` to use backend instead of IDB
- Modify data loading in `dbInitializer.js`
- Update all master pages & modals

**New API Client Functions**:
```javascript
src/api/
├── client.js (axios instance)
├── auth.js (login, logout, verify token)
├── customers.js
├── items.js
├── orders.js
├── tables.js
├── users.js
└── ... (16 master APIs)
```

### Phase 3: Master Pages Refactoring (Week 3-4)
**Priority Order**:
1. **CRITICAL** (Must be first):
   - Users management
   - Items/Menu management
   - Orders & transactions

2. **HIGH** (Next):
   - Customers
   - Tables
   - Auth Users
   - Addons/Combos

3. **MEDIUM** (After):
   - Delivery Agents
   - Ledgers
   - Bookings
   - Offers

4. **LOW** (Last):
   - Units
   - Cooking Instructions
   - Payment Methods

### Phase 4: Audit & Validation (Week 4-5)
- Add audit logging for all changes
- User activity tracking
- Data integrity checks
- Performance optimization

---

## Part 6: MSSQL Schema Overview

### 6.1 Master Tables Sample

```sql
-- Core Masters
CREATE TABLE Customers (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255),
    mobile NVARCHAR(20),
    address NVARCHAR(500),
    regNo NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Items (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255),
    arName NVARCHAR(255),
    price DECIMAL(10,2),
    groupId NVARCHAR(50) FOREIGN KEY REFERENCES ItemGroups(id),
    dietType NVARCHAR(20),
    unitId NVARCHAR(50) FOREIGN KEY REFERENCES Units(id),
    openItem BIT,
    image NVARCHAR(500),
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    user NVARCHAR(100),
    pass NVARCHAR(255), -- HASH THIS!
    role NVARCHAR(50),
    kotRateEditable BIT,
    allowOpenItemSettle BIT,
    waiterId NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Transaction Tables
CREATE TABLE Orders (
    id NVARCHAR(50) PRIMARY KEY,
    billNo INT,
    kotNo INT,
    tableId NVARCHAR(50),
    customerId NVARCHAR(50),
    type NVARCHAR(20), -- DI, TA, DE
    pax INT,
    status NVARCHAR(50),
    totalAmount DECIMAL(10,2),
    taxAmount DECIMAL(10,2),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE OrderItems (
    id NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50) FOREIGN KEY REFERENCES Orders(id),
    itemId NVARCHAR(50) FOREIGN KEY REFERENCES Items(id),
    quantity INT,
    rate DECIMAL(10,2),
    status NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE()
);
```

### 6.2 Additional System Tables

```sql
-- Authentication
CREATE TABLE UserSessions (
    id NVARCHAR(50) PRIMARY KEY,
    userId NVARCHAR(50),
    token NVARCHAR(500),
    loginAt DATETIME,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT GETDATE()
);

-- Audit Trail
CREATE TABLE AuditLog (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId NVARCHAR(50),
    entityType NVARCHAR(100),
    entityId NVARCHAR(50),
    action NVARCHAR(50), -- CREATE, UPDATE, DELETE
    oldValue NVARCHAR(MAX),
    newValue NVARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE()
);
```

---

## Part 7: Migration Strategy

### 7.1 Data Migration Approach

**Option A: Gradual Migration (Recommended)**
1. Run both systems in parallel initially
2. Sync IndexedDB → MSSQL on demand
3. Gradually shift frontend to use backend
4. Complete migration in phases

**Option B: Big Bang Migration**
1. Export all IndexedDB data to JSON
2. Import into MSSQL using SQL scripts
3. Switch frontend to backend entirely
4. Disable IndexedDB

### 7.2 Export Current Data

```javascript
// Export IndexedDB data to JSON
export async function exportDataToJson() {
    const exports = {};
    for (let storeName of ALL_STORE_NAMES) {
        exports[storeName] = await getAllFromStore(storeName);
    }
    return exports;
}

// Then import into MSSQL via API
```

---

## Part 8: Development Priorities & Effort Estimation

| Task | Effort | Duration | Dependencies |
|------|--------|----------|--------------|
| Backend Setup (Express + DB) | 8 pts | 4-5 days | None |
| MSSQL Schema Creation | 5 pts | 2-3 days | Backend Setup |
| User Authentication | 8 pts | 3-4 days | Backend Setup |
| CRUD APIs (16 masters) | 21 pts | 5-7 days | Auth |
| Transaction APIs (4 tables) | 13 pts | 4-5 days | CRUD APIs |
| Frontend API Client Layer | 8 pts | 3-4 days | Backend APIs |
| Config Page Integration | 8 pts | 3-4 days | API Client |
| Master Pages Migration (13 modals) | 21 pts | 6-8 days | Config Page |
| Order Management Integration | 13 pts | 4-5 days | Master Pages |
| Testing & Optimization | 13 pts | 4-5 days | All |
| **TOTAL** | **118 pts** | **6-8 weeks** | - |

---

## Part 9: Critical Configuration Changes

### 9.1 AppContext.jsx Changes Required
- Replace IDB queries with API calls
- Add authentication state
- Implement token refresh logic
- Add error handling for network failures

### 9.2 Environment Configuration
```javascript
// .env file for backend URL
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AUTH_TOKEN_KEY=kot_app_token
VITE_API_TIMEOUT=30000
```

### 9.3 Config Page Updates
- Add backend connection status display
- Database sync status
- User session management
- Backup/restore operations

---

## Part 10: Tech Stack Recommendations

### Frontend (Keep Current)
- React 19.2.4
- React Router 7.13.1
- Tailwind CSS 4.2.1
- Framer Motion 12.36.0
- Vite 8.0.0

### Backend (NEW)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MSSQL Server 2019+
- **ORM**: Sequelize or TypeORM (strongly recommended)
- **Auth**: JWT tokens
- **Validation**: Joi or Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Recommended Packages
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.2",
    "mssql": "^11.0.1",
    "jsonwebtoken": "^9.1.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.12.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  }
}
```

---

## Part 11: Immediate Next Steps

### Quick Win (Next 2 hours):
1. ✅ **This Analysis** - Understand scope
2. Create memory notes for project structure
3. List all entities with their properties

### Week 1 Priorities:
1. Create backend project structure
2. Set up MSSQL database & schema
3. Implement user authentication
4. Create 5 basic CRUD APIs
5. Create API client layer in frontend

### Milestones to Track:
- [ ] Backend server running locally
- [ ] MSSQL database created with 20 tables
- [ ] Authentication working (login/logout)
- [ ] First 3 master pages connected to backend
- [ ] Orders syncing to MSSQL

---

## Part 12: Risk Mitigation

### High-Risk Areas
1. **Data Loss During Migration**: Regular backups, test migration in staging
2. **Network Failures**: Implement offline mode with eventual sync
3. **Performance**: Implement caching & pagination on large datasets
4. **Security**: Hash passwords, use JWT tokens, implement CORS properly

### Testing Strategy
- Unit tests for all API endpoints
- Integration tests for data flow
- E2E tests for critical workflows
- Performance tests with production-like data volumes

---

## Questions to Address Before Starting

1. **Deployment Target**: Where will MSSQL be hosted? (Local, Azure, AWS, On-premises)
2. **Timeline**: When must this be production-ready?
3. **User Count**: How many concurrent users?
4. **Data Volume**: Expected order volume per day/month?
5. **Backup Strategy**: How often and where?
6. **Security**: PCI compliance needed? Multi-factor auth?
7. **Offline Support**: Must app work without internet?
8. **Reporting**: Will you need analytics/dashboard?

---

**Status**: Ready for Phase 1 implementation
**Created**: 2026-07-14
