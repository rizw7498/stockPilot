# StockPilot Backend - Inventory & Order Management API

A production-grade, multi-tenant inventory and order management system built with **Node.js, Express, and Mongoose (MongoDB)** following enterprise domain-driven design and strict ledger-based stock accounting.

---

## 🏗️ Architecture & Core Principles

1. **Multi-Tenant SaaS Isolation**: Every tenant-owned document carries `organizationId`, derived strictly from verified user membership sessions—never trusting raw client input alone.
2. **Double-Entry Style Stock Ledger**:
   - Stock quantities maintain `onHand`, `reserved`, and `available = onHand - reserved`.
   - Direct manual editing of quantity fields outside the inventory service is strictly prohibited.
   - Every stock-changing event creates an immutable `StockMovement` entry (`PURCHASE_RECEIPT`, `SALE_DISPATCH`, `ADJUSTMENT`, `TRANSFER_OUT`, `TRANSFER_IN`, `SALES_RETURN`, etc.).
3. **Role-Based Access Control (RBAC)**: Fine-grained permissions evaluated dynamically per route (`products.read`, `inventory.adjust`, `purchases.receive`, `sales.fulfill`, etc.).
4. **Financial Integer Precision**: Currency amounts are stored in minor integer units (e.g. cents/paisa) to eliminate floating-point rounding errors.

---

## 📁 Directory Structure

```
server/
├── src/
│   ├── config/             # DB & Environment variables
│   ├── middleware/         # Auth, Tenant isolation, RBAC, Validation, Error Handling, RequestId
│   ├── shared/
│   │   ├── constants/      # Roles, Permissions, Status enumerations
│   │   ├── errors/         # Operational errors (AppError, InsufficientStock, etc.)
│   │   └── utils/          # JWT handling, JSON envelopes
│   ├── modules/
│   │   ├── auth/           # Registration, Login, Refresh tokens, User profiles
│   │   ├── organizations/  # Tenant profiles, Member invitations, Custom roles
│   │   ├── warehouses/     # Multi-warehouse management
│   │   ├── categories/     # Product taxonomy & parent-child categories
│   │   ├── products/       # Catalog items with SKU, barcode, unit, cost & sale prices
│   │   ├── inventory/      # Balances, append-only ledger, adjustments, low-stock engine
│   │   ├── suppliers/      # Supplier profiles & balances
│   │   ├── customers/      # Customer directory & credit limits
│   │   ├── purchases/      # PO lifecycle & Goods Receiving (updates onHand & ledger)
│   │   ├── sales/          # Sales orders, Stock reservation, and Fulfillment/Dispatch
│   │   ├── invoices/       # Invoicing & line item snapshots
│   │   ├── payments/       # Inbound customer payments & outbound supplier settlements
│   │   ├── returns/        # Sales & Purchase returns with disposition (restock vs scrap)
│   │   ├── transfers/      # Inter-warehouse transfer lifecycle (In-transit state)
│   │   ├── reports/        # Dashboard KPIs & Inventory Valuation
│   │   ├── audit/          # Immutable system activity logs
│   │   └── notifications/  # Low-stock and workflow alerts
│   ├── app.js              # Express app configuration & route registry
│   └── server.js           # Server bootstrap & graceful shutdown
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
Ensure your `.env` contains:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stockpilot
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### 3. Run Server
```bash
# Production / standard start:
npm start

# Development mode with hot-reloading:
npm run dev
```

---

## 📡 API Endpoint Overview (`/api/v1`)

| Module | Endpoints | Purpose |
| :--- | :--- | :--- |
| **Health** | `GET /health` | Service health status & uptime |
| **Auth** | `POST /auth/register`<br>`POST /auth/login`<br>`POST /auth/logout`<br>`POST /auth/refresh`<br>`GET /auth/me` | Tenant onboarding, JWT cookies & authentication |
| **Organizations** | `GET /organizations/current`<br>`PATCH /organizations/current`<br>`GET /organizations/members`<br>`POST /organizations/invite`<br>`GET /organizations/roles` | Multi-tenant administration and team access |
| **Warehouses** | `GET /warehouses`<br>`POST /warehouses`<br>`GET /warehouses/:id`<br>`PATCH /warehouses/:id` | Manage multi-location warehouses |
| **Categories** | `GET /categories`<br>`POST /categories`<br>`PATCH /categories/:id`<br>`DELETE /categories/:id` | Product categories |
| **Products** | `GET /products`<br>`POST /products`<br>`GET /products/:id`<br>`GET /products/:id/stock`<br>`PATCH /products/:id`<br>`DELETE /products/:id` | Catalog items, SKU tracking, opening stock initialization |
| **Inventory** | `GET /inventory`<br>`GET /inventory/ledger`<br>`GET /inventory/low-stock`<br>`POST /inventory/adjustments`<br>`POST /inventory/adjustments/:id/approve` | Warehouse stock balances, movement audit trail, variance adjustments |
| **Suppliers** | `GET /suppliers`<br>`POST /suppliers`<br>`PATCH /suppliers/:id` | Supplier directory and accounts payable balances |
| **Customers** | `GET /customers`<br>`POST /customers`<br>`PATCH /customers/:id` | Customer profiles and credit tracking |
| **Purchasing** | `GET /purchase-orders`<br>`POST /purchase-orders`<br>`POST /purchase-orders/:id/submit`<br>`POST /purchase-orders/:id/approve`<br>`POST /purchase-orders/:id/receipts`<br>`POST /purchase-orders/:id/cancel` | PO workflow & atomic goods receipts into inventory |
| **Sales** | `GET /sales-orders`<br>`POST /sales-orders`<br>`POST /sales-orders/:id/confirm`<br>`POST /sales-orders/:id/fulfillments`<br>`POST /sales-orders/:id/cancel` | SO workflow, stock reservation & dispatch fulfillment |
| **Invoices** | `GET /invoices`<br>`POST /invoices`<br>`GET /invoices/:id` | Sales order billing and customer accounts receivable |
| **Payments** | `GET /payments`<br>`POST /payments` | Inbound payments & account settlements |
| **Returns** | `GET /returns`<br>`POST /returns`<br>`POST /returns/:id/approve`<br>`POST /returns/:id/complete` | Sales/Purchase returns with restock/scrap disposition |
| **Transfers** | `GET /transfers`<br>`POST /transfers`<br>`POST /transfers/:id/approve`<br>`POST /transfers/:id/dispatch`<br>`POST /transfers/:id/receive` | Inter-warehouse stock transfers with in-transit states |
| **Reports** | `GET /reports/dashboard`<br>`GET /reports/stock-valuation` | Dashboard KPI metrics and valuation calculations |
| **Audit Logs** | `GET /audit-logs` | Immutable audit trail |
| **Notifications**| `GET /notifications`<br>`PATCH /notifications/:id/read` | Real-time workflow notifications |

