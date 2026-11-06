# StockPilot Design System & Enterprise UI Specification

## 1. Overview & Aesthetic Philosophy
StockPilot's presentation layer is redesigned into a **high-definition Glassmorphic enterprise interface** inspired by Stripe Dashboard, Linear, and Vercel.

### Anti-"AI Look" Principles Enforced
- **Zero Rainbow Gradients & Neon Glows**: Single primary accent `#3B82F6` (Electric Blue). Semantic colors (Emerald, Amber, Rose, Sky) appear exclusively inside status pills, delta indicators, and alert highlights.
- **Strict 4px Spacing Grid**: Form inputs and buttons at 36px, table rows at 40px, cards at 12px border-radius, inputs at 8px, modals at 16px.
- **Operational Density**: High-density typography (13px base body, 11px uppercase table headers, tabular numbers for all monetary and quantitative data).
- **JetBrains Mono Microchips**: Dedicated monospace chips for SKUs, order identifiers (`PO-`, `SO-`, `INV-`, `TRF-`, `RET-`), barcodes, and ledger deltas.
- **Physical Depth**: Subtle SVG grain overlay (3.5% opacity) to eliminate color banding, layered on top of two ultra-soft radial atmosphere lights.

---

## 2. Token Specification & Glass Tiers

### Atmosphere (Base Background: `#070B14`)
```css
/* Radial lights */
background-image: 
  radial-gradient(circle 850px at 0% 0%, rgba(59, 130, 246, 0.14), transparent 85%),
  radial-gradient(circle 800px at 100% 100%, rgba(14, 165, 233, 0.08), transparent 85%);
```

### Glass Surface Tiers
| Tier | Target Elements | CSS Properties |
| :--- | :--- | :--- |
| **`glass-1`** | Sidebar, Header rail | `rgba(15, 23, 42, 0.65)`, `blur(20px) saturate(140%)`, `border: 1px rgba(255,255,255,0.08)` |
| **`glass-2`** | Cards, Master Panels, KPI Widgets | `rgba(30, 41, 59, 0.48)`, `blur(16px)`, `inset 0 1px 0 rgba(255,255,255,0.07)` |
| **`glass-3`** | Data Tables, Input Fields, Dropdowns | `rgba(15, 23, 42, 0.88)`, `blur(12px)`, near-opaque for WCAG AA text contrast |
| **`glass-overlay`** | Slide-over Drawers, Modals, Command Palette | `rgba(17, 24, 39, 0.92)`, `blur(28px)`, `box-shadow: 0 24px 80px rgba(0,0,0,0.65)` |
| **`glass-scrim`** | Overlay backdrops | `rgba(3, 6, 12, 0.65)`, `blur(4px)` |

---

## 3. Reusable UI Primitives (`client/src/components/ui/`)

1. **`Button.jsx`**
   - Supports `primary`, `secondary` (glass-3), `danger`, and `ghost`.
   - Sizes `sm` (28px), `md` (36px), `lg` (40px), `icon` (32px).
   - Integrated spinner for asynchronous mutations (`loading` prop).
2. **`Input.jsx`**
   - 36px height (`h-9`), glass-3 background, 1px border.
   - Blue focus ring (`focus:ring-2 focus:ring-blue-500/40`), inline validation with danger icon and message.
3. **`Select.jsx`**
   - 36px custom dropdown with chevron indicator and styled dark options.
4. **`StatusPill.jsx`**
   - 22px height, 11px medium text, colored dot + semantic tinted background and border.
   - Centralized status configuration (`DRAFT`, `ORDERED`, `CONFIRMED`, `RESERVED`, `FULFILLED`, `RECEIVED`, `PAID`, `CANCELLED`, `LOW_STOCK`, etc.).
5. **`GlassCard.jsx`**
   - `glass-2` surface with inset top highlight, header title, subtitle, and action slot.
6. **`KpiCard.jsx`**
   - Metric card with 30px tabular value, delta chip (`+/- %`), optional 14-day sparkline bar chart, and warning top-edge glow on low stock items.
7. **`DataTable.jsx`**
   - 40px row height, sticky blurred header, right-aligned tabular numbers, hairline dividers, hover state, sortable headers, pagination footer, and floating glass bulk action bar.
8. **`Modal.jsx` & `Drawer.jsx`**
   - `glass-overlay` dialogs with `glass-scrim` backdrops, keyboard escape handler, sticky headers and action footers.
9. **`Tabs.jsx`**
   - Underline navigation tabs with dynamic numeric count chips.
10. **`Toolbar.jsx`**
    - Search input with `/` keyboard shortcut listener, filter dropdowns, active removable chips, and "Clear all" button.
11. **`CommandPalette.jsx`**
    - Omnisearch palette triggered by `Cmd+K` / `Ctrl+K` or clicking the search trigger in the header with arrow key navigation.
12. **`ConfirmModal.jsx`**
    - Destructive action confirmation dialog with danger styling and loading protection.
13. **`Skeleton.jsx`**
    - Layout-matching shimmer skeletons for KPI cards and table rows.
14. **`EmptyState.jsx`**
    - Glass tile line-art icon with operational guidance text and primary call-to-action button.

---

## 4. Rebuilt Application Modules

| Module Route | Key Redesign Features |
| :--- | :--- |
| **`/` (Dashboard)** | Greeting-free header with "Last synced" timestamp; 6-card KPI grid with asymmetric emphasis and sparklines; Recent Sales Orders table; Operational Health checklist card; Quick action shortcuts. |
| **`/roles` (Roles & Permissions)** | Master-Detail layout; left role list with lock badge on system roles; right detail panel with permission coverage rate; granular 46-capability matrix with domain rows and select-all toggles. |
| **`/products` (Product Catalog)** | Search and category filter toolbar; DataTable with SKU chips and calculated profit margin % under sale price; slide-over drawer with per-warehouse stock breakdown (`onHand`, `reserved`, `available`). |
| **`/inventory` (Ledger & Balances)** | Segmented tabs for Warehouse Balances, Movement Ledger, and Low Stock Alerts; stock adjustment drawer with live variance calculation between current on-hand and counted quantity. |
| **`/sales` (Sales Orders)** | Order table with fulfillment status pills; Create Sales Order drawer with live order total calculation; Dispatch modal with carrier tracking and stock fulfillment allocation; Order details drawer. |
| **`/purchasing` (Purchase Orders)** | Vendor purchase order tracking; New PO drawer with commitment calculation; Receive Goods modal for warehouse intake. |
| **`/invoices` (Customer Invoices)** | Accounts receivable ledger with payment progress; Record Payment modal with payment method selection and transaction reference. |
| **`/payments` (Payments History)** | Incoming and outgoing cash flow audit records with directional indicators and method chips. |
| **`/transfers` (Warehouse Transfers)** | Inter-warehouse transit tracking (`Origin → Destination`), dispatch and receipt handlers. |
| **`/returns` (Returns & RMAs)** | Disposition evaluation table (restock vs scrap) with one-click completion. |
| **`/warehouses` (Warehouse Locations)** | Facility cards with location codes, address lines, and default dispatch hub status. |
| **`/categories` (Categories)** | Product taxonomy table with creation modal and delete confirmation. |
| **`/team` (Team Members)** | Organization membership table with user initials, role badges, and invitation modal. |
| **`/audit` (Audit Logs)** | Cryptographically clean system audit trail with timestamp, actor, action, and domain entity. |
| **`/reports` (Valuation Reports)** | Total inventory valuation KPI cards and detailed FIFO position tables. |
| **`/settings` (Workspace Settings)** | Two-column settings layout with configuration sidebar: General, Appearance & Themes (6 color swatches), Team, Roles, Warehouses, and Security & Audit. |
| **`/login` & `/register` (Authentication)** | Atmospheric split-screen layout with 3 key architectural value props on the left and glass-overlay form on the right. |

---

## 5. Typography & Multi-Theme Architecture

### Typography Stack
- **Primary Interface**: **Poppins** (`300`, `400`, `500`, `600`, `700`) — Clean geometry, human warmth, and modern SaaS polish.
- **Monospace Microchips**: **JetBrains Mono** — SKUs, order identifiers (`PO-`, `SO-`, `INV-`, `TRF-`, `RET-`), barcodes, and tabular numbers.

### Color Theme Switcher (`ThemeContext.jsx`)
StockPilot includes 6 enterprise color themes with dynamic focus rings, active sidebar items, button states, and radial atmosphere glow:
- **`blue`** (Electric Blue — `#3B82F6`)
- **`emerald`** (Emerald Mint — `#10B981`)
- **`violet`** (Linear Violet — `#6366F1`)
- **`amber`** (Industrial Amber — `#F59E0B`)
- **`rose`** (Crimson Rose — `#F43F5E`)
- **`cyan`** (Cyber Cyan — `#06B6D4`)


