# Master Pages & Entity Management UI Analysis

## Overview
Your app currently has **19 different master data management UIs** spread across:
- **6 dedicated master pages**
- **13 entity modals** (via EntityManagerModal in ConfigPage)

This document details each one and prioritizes the MSSQL integration work.

---

## CATEGORY A: Dedicated Master Pages (6 Pages)

### 1. ProductChoiceMaster.jsx ⭐ CRITICAL
**Current Location**: [src/pages/ProductChoiceMaster.jsx](src/pages/ProductChoiceMaster.jsx)  
**Manages**: Menu Items (ITEMS master)

**Current Features**:
- [ ] View all items
- [ ] Search/filter items
- [ ] Create new item
- [ ] Edit item (name, price, category, diet type, image)
- [ ] Delete item
- [ ] Bulk operations (optional)

**Backend Migration Required**:
- [ ] API: GET /api/items (list, with pagination)
- [ ] API: GET /api/items/:id
- [ ] API: POST /api/items (create)
- [ ] API: PUT /api/items/:id (update)
- [ ] API: DELETE /api/items/:id
- [ ] File upload handling for images
- [ ] Validation on backend

**Dependencies on Other Masters**:
- Groups (ITEMS reference GROUPS)
- Units (ITEMS reference UNITS)
- Addons (via ItemAddonMaster)

**Data Sample Size**: 50+ items
**Complexity**: **HIGH** - Image handling, relationships

---

### 2. AddonMaster.jsx ⭐ HIGH PRIORITY
**Current Location**: [src/pages/AddonMaster.jsx](src/pages/AddonMaster.jsx)  
**Manages**: Add-on/Extra Items

**What it Does**:
- Create/edit available add-ons (e.g., "Extra Cheese", "Extra Sauce")
- Each addon has its own pricing
- Used when customers want to customize items

**Backend Migration Required**:
- [ ] API: GET /api/addons
- [ ] API: POST /api/addons
- [ ] API: PUT /api/addons/:id
- [ ] API: DELETE /api/addons/:id

**Dependencies**: None (standalone master)

**Data Structure Needed**:
```javascript
{
  id: string,
  name: string,
  price: decimal,
  category: string,
  isActive: boolean
}
```

**Complexity**: **MEDIUM** - Simple CRUD

---

### 3. ItemAddonMaster.jsx ⭐ HIGH PRIORITY
**Current Location**: [src/pages/ItemAddonMaster.jsx](src/pages/ItemAddonMaster.jsx)  
**Manages**: Item-Addon Mapping (ITEM_ADDON_LINKS)

**What it Does**:
- Map which add-ons are available for each menu item
- Example: "Paneer Tikka" can have ["Extra Sauce", "Lemon"]
- Many-to-many relationship

**Backend Migration Required**:
- [ ] API: GET /api/item-addons/item/:itemId
- [ ] API: POST /api/item-addons/link (create mapping)
- [ ] API: DELETE /api/item-addons/unlink
- [ ] API: GET /api/item-addons (all mappings)

**Database Schema**:
```sql
CREATE TABLE ItemAddonLinks (
    id INT PRIMARY KEY IDENTITY,
    itemId NVARCHAR(50),
    addonId NVARCHAR(50),
    isOptional BIT,
    displayOrder INT,
    FOREIGN KEY (itemId) REFERENCES Items(id),
    FOREIGN KEY (addonId) REFERENCES Addons(id)
)
```

**Complexity**: **MEDIUM-HIGH** - Relationship management

---

### 4. TablesPage.jsx ⭐ HIGH PRIORITY
**Current Location**: [src/pages/TablesPage.jsx](src/pages/TablesPage.jsx)  
**Manages**: Restaurant Tables (TABLES master)

**What it Does**:
- Display physical tables in floor plan
- Mark tables as occupied/vacant/reserved
- Create/edit/delete tables
- Assign to floors
- Visual layout management

**Current Features**:
- [ ] Table grid view
- [ ] Table status updates
- [ ] Create new table
- [ ] Edit table properties
- [ ] Set table capacity
- [ ] Assign to floor

**Backend Migration Required**:
- [ ] API: GET /api/tables
- [ ] API: GET /api/tables/:id
- [ ] API: POST /api/tables
- [ ] API: PUT /api/tables/:id (update including status)
- [ ] API: DELETE /api/tables/:id
- [ ] WebSocket updates for real-time status (optional but recommended)

**Dependencies**: Floors (optional, tables can reference floors)

**Complexity**: **MEDIUM** - Real-time updates needed

---

### 5. BookingsPage.jsx
**Current Location**: [src/pages/BookingsPage.jsx](src/pages/BookingsPage.jsx)  
**Manages**: Table Reservations (BOOKINGS master)

**What it Does**:
- Create table reservations
- View booking calendar
- Confirm/cancel bookings
- Track customer name, party size, time

**Backend Migration Required**:
- [ ] API: GET /api/bookings (with filters: date range, status)
- [ ] API: GET /api/bookings/:id
- [ ] API: POST /api/bookings
- [ ] API: PUT /api/bookings/:id
- [ ] API: DELETE /api/bookings/:id
- [ ] API: PUT /api/bookings/:id/confirm
- [ ] Availability checking (no double bookings)

**Dependencies**: Customers, Tables

**Complexity**: **MEDIUM** - Validation needed for availability

---

### 6. DeliveryDashboard.jsx
**Current Location**: [src/pages/DeliveryDashboard.jsx](src/pages/DeliveryDashboard.jsx)  
**Manages**: Delivery Orders Tracking

**What it Does**:
- View pending delivery orders
- Assign delivery agents
- Track delivery status
- Real-time location updates (optional)

**Backend Migration Required**:
- [ ] API: GET /api/orders?type=DE (delivery orders)
- [ ] API: GET /api/orders/:id/tracking
- [ ] API: PUT /api/orders/:id/assign-agent
- [ ] API: PUT /api/orders/:id/status
- [ ] WebSocket for real-time updates

**Dependencies**: Orders, Delivery Agents

**Complexity**: **HIGH** - Real-time tracking, many dependencies

---

## CATEGORY B: Entity Manager Modals (13 Modals)

These are accessed via the ConfigPage's "Database Management" section.

### Location Reference
**File**: [src/pages/ConfigPage.jsx](src/pages/ConfigPage.jsx#L200-L220)  
**Component**: EntityManagerModal (modal, auto-generates CRUD UI)

---

### B1. USERS Modal ⭐⭐ CRITICAL
**Button**: "Staff & Users"  
**Manages**: User accounts (USERS master)

**What it Shows**:
- List of all staff login accounts
- Username, role, permissions

**Entity Details**:
```javascript
{
  id, user, pass, role, 
  kotRateEditable, allowOpenItemSettle, waiterId
}
```

**Backend Work**:
- [ ] API: GET /api/users
- [ ] API: POST /api/users (CREATE with password hashing)
- [ ] API: PUT /api/users/:id (UPDATE, no password in response)
- [ ] API: DELETE /api/users/:id
- [ ] Password change endpoint: PUT /api/users/:id/password
- **SECURITY**: Never expose raw passwords

**Complexity**: **HIGH** - Security-sensitive

---

### B2. WAITERS Modal ⭐ HIGH PRIORITY
**Button**: "Waiters"  
**Manages**: Service staff (WAITERS master)

**Entity Details**:
```javascript
{
  id, name, pass, isAllowedKotCancel
}
```

**Backend Work**:
- [ ] API: GET /api/waiters
- [ ] API: POST /api/waiters
- [ ] API: PUT /api/waiters/:id
- [ ] API: DELETE /api/waiters/:id

**Complexity**: **LOW** - Simple CRUD

---

### B3. DELIVERY_AGENTS Modal
**Button**: "Delivery Agents"  
**Manages**: Delivery personnel (DELIVERY_AGENTS master)

**Entity Details**:
```javascript
{
  id, name, mobile, vahanNo (vehicle number)
}
```

**Backend Work**:
- [ ] API: GET /api/delivery-agents
- [ ] API: POST /api/delivery-agents
- [ ] API: PUT /api/delivery-agents/:id
- [ ] API: DELETE /api/delivery-agents/:id

**Complexity**: **LOW** - Simple CRUD

---

### B4. AUTH_USERS Modal ⭐ HIGH PRIORITY
**Button**: "Auth Configs"  
**Manages**: Authorization policies (AUTH_USERS master)

**What it Does**:
- Manage per-user permissions
- Decide who can cancel KOTs
- Access control matrix

**Entity Details**:
```javascript
{
  id (references Users.id), 
  cancelKot (boolean)
}
```

**Backend Work**:
- [ ] API: GET /api/auth-users
- [ ] API: POST /api/auth-users
- [ ] API: PUT /api/auth-users/:id
- [ ] Check authorization middleware

**Complexity**: **HIGH** - Security policy management

---

### B5. TABLES Modal ⭐ HIGH PRIORITY
**Button**: "Tables"  
**Manages**: Physical tables (TABLES master)

**Same as TablesPage but in modal form**

**Entity Details**:
```javascript
{
  id, name, floorId, capacity, status, type
}
```

**Note**: This is duplicated with TablesPage. Eventually, either:
- Remove modal and use dedicated page only, OR
- Keep modal for quick edits in config page

**Complexity**: **MEDIUM**

---

### B6. FLOORS Modal
**Button**: "Floors"  
**Manages**: Restaurant areas (FLOORS master)

**Entity Details**:
```javascript
{
  id, name, description
}
```

**Backend Work**:
- [ ] API: GET /api/floors
- [ ] API: POST /api/floors
- [ ] API: PUT /api/floors/:id
- [ ] API: DELETE /api/floors/:id

**Complexity**: **LOW** - Simple CRUD

---

### B7. GROUPS Modal ⭐ HIGH PRIORITY
**Button**: "Menu Groups"  
**Manages**: Item categories (GROUPS master)

**Entity Details**:
```javascript
{
  id, name (e.g., "STARTERS (VEG)")
}
```

**Backend Work**:
- [ ] API: GET /api/groups
- [ ] API: POST /api/groups
- [ ] API: PUT /api/groups/:id
- [ ] API: DELETE /api/groups/:id

**Note**: Must handle 8 existing groups + ability to add more

**Complexity**: **LOW** - Simple CRUD

---

### B8. ITEMS Modal ⭐⭐ CRITICAL
**Button**: "Menu Items"  
**Manages**: Menu items (ITEMS master)

**Same as ProductChoiceMaster but in modal form**

**Note**: This is duplicated with ProductChoiceMaster. Same complexity.

**Complexity**: **HIGH** - Many properties, images, relationships

---

### B9. CUSTOMERS Modal
**Button**: (Not visible in current UI - need to add button)  
**Manages**: Customer database (CUSTOMERS master)

**Entity Details**:
```javascript
{
  id, name, mobile, address, regNo
}
```

**Backend Work**:
- [ ] API: GET /api/customers
- [ ] API: POST /api/customers
- [ ] API: PUT /api/customers/:id
- [ ] API: DELETE /api/customers/:id
- [ ] Search by mobile/name

**Complexity**: **LOW** - Simple CRUD

---

### B10. PAYMENT_METHODS Modal
**Button**: "Pay Methods"  
**Manages**: Payment types (PAYMENT_METHODS master)

**Entity Details**:
```javascript
{
  id, name, ledgerId, description
}
```

**Backend Work**:
- [ ] API: GET /api/payment-methods
- [ ] API: POST /api/payment-methods
- [ ] API: PUT /api/payment-methods/:id
- [ ] API: DELETE /api/payment-methods/:id

**Complexity**: **MEDIUM** - References ledgers

---

### B11. MULTI_PAY_TYPES Modal
**Button**: "Multi Pay"  
**Manages**: Split payment configs (MULTI_PAY_TYPES master)

**What it Does**:
- Configure split payment rules
- Example: 50% cash + 50% card

**Backend Work**:
- [ ] API: GET /api/multi-pay-types
- [ ] API: POST /api/multi-pay-types
- [ ] API: PUT /api/multi-pay-types/:id
- [ ] API: DELETE /api/multi-pay-types/:id

**Complexity**: **MEDIUM** - Config logic

---

### B12. LEDGERS Modal
**Button**: "Ledgers"  
**Manages**: Accounting heads (LEDGERS master)

**Entity Details**:
```javascript
{
  id, name, type (ASSET/LIABILITY/INCOME/EXPENSE), balance
}
```

**Backend Work**:
- [ ] API: GET /api/ledgers
- [ ] API: POST /api/ledgers
- [ ] API: PUT /api/ledgers/:id
- [ ] API: DELETE /api/ledgers/:id

**Complexity**: **HIGH** - Financial data, audit required

---

### B13. COOKING_INSTRUCTIONS Modal
**Button**: "Cooking Instr."  
**Manages**: Preparation notes (COOKING_INSTRUCTIONS master)

**Entity Details**:
```javascript
{
  id, name (e.g., "Extra Spicy"), description
}
```

**Backend Work**:
- [ ] API: GET /api/cooking-instructions
- [ ] API: POST /api/cooking-instructions
- [ ] API: PUT /api/cooking-instructions/:id
- [ ] API: DELETE /api/cooking-instructions/:id

**Complexity**: **LOW** - Simple CRUD

---

### B14. UNITS Modal
**Button**: "Units"  
**Manages**: Measurement units (UNITS master)

**Entity Details**:
```javascript
{
  id, name, decimals
}
```

**Backend Work**:
- [ ] API: GET /api/units
- [ ] API: POST /api/units
- [ ] API: PUT /api/units/:id
- [ ] API: DELETE /api/units/:id

**Note**: Units are rarely modified; can have pre-defined list

**Complexity**: **LOW** - Simple CRUD

---

### B15. OFFERS Modal (NOT CURRENTLY VISIBLE)
**Manages**: Promotions (OFFERS master)

**Entity Details**:
```javascript
{
  id, name, type, value, applicableItems, validFrom, validTo, isActive
}
```

**Backend Work**:
- [ ] API: GET /api/offers
- [ ] API: POST /api/offers
- [ ] API: PUT /api/offers/:id
- [ ] API: DELETE /api/offers/:id
- [ ] Apply offer to bill calculations

**Complexity**: **MEDIUM** - Complex rules and date validations

---

### B16. ORGANIZERS Modal (NOT CURRENTLY VISIBLE)
**Manages**: Quick menu sections (ORGANIZERS master)

**Entity Details**:
```javascript
{
  id, name, items (array of item IDs)
}
```

**Backend Work**:
- [ ] API: GET /api/organizers
- [ ] API: POST /api/organizers
- [ ] API: PUT /api/organizers/:id
- [ ] API: DELETE /api/organizers/:id

**Complexity**: **MEDIUM** - Array handling

---

## Implementation Priority Matrix

### TIER 1: MUST DO FIRST (Critical Path)
| Entity | Page/Modal | Effort | Order |
|--------|-----------|--------|-------|
| USERS | Auth_Users Modal | 8 pts | 1st |
| ITEMS | ProductChoiceMaster.jsx | 13 pts | 2nd |
| GROUPS | Groups Modal | 3 pts | 3rd |
| TABLES | TablesPage.jsx | 8 pts | 4th |
| ADDONS | AddonMaster.jsx | 5 pts | 5th |
| ITEM_ADDON_LINKS | ItemAddonMaster.jsx | 8 pts | 6th |

**Total**: 45 story points | **Estimated**: 2 weeks

---

### TIER 2: HIGH PRIORITY (Core Operations)
| Entity | Page/Modal | Effort | Order |
|--------|-----------|--------|-------|
| AUTH_USERS | AuthUsers Modal | 5 pts | 7th |
| WAITERS | Waiters Modal | 3 pts | 8th |
| CUSTOMERS | Customers Modal | 3 pts | 9th |
| PAYMENT_METHODS | PaymentMethods Modal | 5 pts | 10th |
| LEDGERS | Ledgers Modal | 5 pts | 11th |
| FLOORS | Floors Modal | 3 pts | 12th |
| BOOKINGS | BookingsPage.jsx | 8 pts | 13th |

**Total**: 32 story points | **Estimated**: 1.5 weeks

---

### TIER 3: MEDIUM PRIORITY (Enhanced Features)
| Entity | Page/Modal | Effort | Order |
|--------|-----------|--------|-------|
| COOKING_INSTRUCTIONS | CookingInstr Modal | 2 pts | 14th |
| UNITS | Units Modal | 2 pts | 15th |
| DELIVERY_AGENTS | DeliveryAgents Modal | 3 pts | 16th |
| MULTI_PAY_TYPES | MultiPayTypes Modal | 5 pts | 17th |
| OFFERS | Offers Modal | 5 pts | 18th |
| ORGANIZERS | Organizers Modal | 5 pts | 19th |

**Total**: 22 story points | **Estimated**: 1 week

---

### TIER 4: LOW PRIORITY (Nice to Have)
| Entity | Page/Modal | Effort | Order |
|--------|-----------|--------|-------|
| DeliveryDashboard | DeliveryDashboard.jsx | 13 pts | 20th |

---

## Duplicated UIs (Consolidation Opportunities)

| Master | Current UIs | Recommendation |
|--------|-------------|-----------------|
| ITEMS | ProductChoiceMaster.jsx + Modal | Use dedicated page; remove modal |
| TABLES | TablesPage.jsx + Modal | Use dedicated page; remove modal |
| BOOKINGS | BookingsPage.jsx | Dedicated page only |
| DELIVERY | DeliveryDashboard.jsx | Dedicated page only |

---

## Frontend Code Files That Need Updates

### Phase 1 Changes (Tier 1):
```
src/pages/
├── ProductChoiceMaster.jsx (→ connect to /api/items)
├── AddonMaster.jsx (→ connect to /api/addons)
├── ItemAddonMaster.jsx (→ connect to /api/item-addons)
├── TablesPage.jsx (→ connect to /api/tables)
└── ConfigPage.jsx (→ update EntityManagerModal calls)

src/components/modals/
└── EntityManagerModal.jsx (→ make generic API connector)

src/context/
└── AppContext.jsx (→ replace IDB queries with API calls)

src/api/ (NEW)
├── client.js (axios instance with auth headers)
├── auth.js (login, logout)
├── items.js (item CRUD)
├── addons.js (addon CRUD)
└── tables.js (table CRUD)
```

---

## Testing Checklist per Master Page

For each master page migration, verify:
- [ ] List/Search functionality works
- [ ] Create new entity works
- [ ] Edit existing entity works
- [ ] Delete entity works (soft delete?)
- [ ] Validation errors display correctly
- [ ] Load states show spinner
- [ ] Error handling for network failures
- [ ] Data persists after page refresh
- [ ] Related entities load correctly
- [ ] Permissions checked (who can edit?)

---

**Status**: Detailed breakdown complete, ready for backend implementation  
**Last Updated**: 2026-07-14
