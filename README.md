# StockPilot - Modern Multi-Tenant Inventory & Order Management System

StockPilot is an enterprise-ready, multi-tenant inventory and order management SaaS platform built with the **MERN** stack (MongoDB, Express, React JSX, Node.js) and styled with **Tailwind CSS**.

---

## 🚀 Key Features

- **Multi-Tenant SaaS Architecture**: Strict tenant isolation across all operational records, with organization-scoped sessions and memberships.
- **Dynamic Roles & Permissions (RBAC)**: Fine-grained permissions catalog (46 permissions) customizable per role, with full SuperAdmin operational bypass.
- **Double-Entry Style Stock Ledger**:
  - Live inventory tracking: `onHand`, `reserved`, and `available = onHand - reserved`.
  - Append-only `StockMovement` audit ledger for every stock-changing event (`OPENING_STOCK`, `PURCHASE_RECEIPT`, `SALE_DISPATCH`, `ADJUSTMENT`, `TRANSFER_OUT`, `TRANSFER_IN`, `SALES_RETURN`, etc.).
  - Reorder thresholds and low-stock replenishment alerts.
- **Purchasing & Goods Receiving**:
  - Full PO lifecycle: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `PARTIALLY_RECEIVED` $\rightarrow$ `RECEIVED`.
  - Atomic goods receipt increases `onHand` inventory and records stock ledger entries.
- **Sales & Fulfillment**:
  - Order-to-cash workflow: `DRAFT` $\rightarrow$ `CONFIRMED` $\rightarrow$ `RESERVED` $\rightarrow$ `FULFILLED`.
  - Real-time stock reservation and fulfillment dispatch.
- **Invoicing & Accounts Receivable/Payable**:
  - Automated invoicing with snapshot line items.
  - Payment recording (cards, wires, cash, online) with balance due settlement.
- **Logistics & Quality**:
  - Multi-warehouse location management.
  - Inter-warehouse transfers with `IN_TRANSIT` tracking.
  - Sales & Purchase returns with restock vs. scrap disposition.
- **Analytics & Audit**:
  - Operational KPI cards and inventory cost-basis valuation reports.
  - Immutable system audit trail.

---

## 📁 Repository Structure

```
StockPilot/
├── server/                 # Node.js + Express.js + Mongoose REST API
│   ├── src/
│   │   ├── config/         # Database and environment configurations
│   │   ├── middleware/     # Auth, Tenant isolation, RBAC, Validation, Error Handling
│   │   ├── shared/         # Constants, Permissions, Errors, JWT & Helpers
│   │   ├── modules/        # Domain modules (auth, orgs, products, inventory, purchasing, sales, finance, etc.)
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── client/                 # React (JSX) + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── app/            # AuthContext & ToastContext
│   │   ├── components/     # AppShell, Sidebar, Header
│   │   ├── features/       # Dashboard, Products, Inventory, Sales, Purchasing, Invoices, Roles, etc.
│   │   └── services/       # Centralized Axios API client
│   └── vite.config.js
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **MongoDB** (Local instance or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Update your MongoDB_URI and JWT secrets in .env if needed
npm run dev
```

The backend server runs on `http://localhost:5000` (Health check: `/api/v1/health`).

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The frontend application runs on `http://localhost:5173`.
