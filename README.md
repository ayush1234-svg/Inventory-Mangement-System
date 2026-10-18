# WTL Mobile Shop Management System

A high-performance, production-grade Point of Sale (POS), Inventory Management, and Business Intelligence web application tailored specifically for retail mobile phone and accessory shops.

---

## 1. Architectural Highlights

- **Integer Paise Financial Precision**: All monetary values (cost price, retail price, line totals, discounts, taxes, subtotals, grand totals) are calculated and persisted strictly as integer paise ($1\text{ INR} = 100\text{ paise}$). This eliminates floating-point arithmetic errors.
- **Atomic Stock Management & Concurrency**: Multi-item sales use atomic conditional updates (`stockQuantity: { $gte: requestedQty }`). If MongoDB replica sets are active, MongoDB session transactions are utilized; otherwise, an atomic compensation rollback mechanism guarantees that inventory is never left in a negative or partially decremented state.
- **Idempotency Protection**: Every sale request carries a client-generated UUID idempotency key. Double-clicking "Complete Sale" or retrying after network drops returns the committed invoice immediately without duplicate sales or double-decrementing stock.
- **Immutable Historical Invoices**: At checkout time, an immutable snapshot of each product's title, specifications, unit selling price, and historical purchase cost is permanently stored inside the invoice. Editing or archiving products in the catalogue never alters historical invoices.
- **Authentic Gross Profit Intelligence**: Gross profit is computed by subtracting the actual historical purchase cost captured at sale time from the net revenue (excluding tax collected), distinguishing gross profit from overall revenue.
- **Restrained SaaS Design**: Minimalist, human-crafted design built with Tailwind CSS. Crisp typography, subtle borders, high-contrast badges for stock levels, and dedicated `@media print` CSS for retail receipt printing and saving as PDF.

---

## 2. Technology Stack

### Frontend (`client/`)
- **React 19** with **TypeScript**
- **Vite 8** for lightning-fast HMR and optimized production bundles
- **Tailwind CSS v4** (`@tailwindcss/vite`) with custom print stylesheets
- **React Router v7** for single-page client routing and route guards
- **Lucide React** for lightweight icons

### Backend (`server/`)
- **Node.js 22** & **Express 5** with **TypeScript**
- **MongoDB Atlas** / **Mongoose 9**
- **Zod** for schema and request validation
- **JWT** (`jsonwebtoken`) & `cookie-parser` for secure HttpOnly cookie session handling
- **Bcrypt.js** for password hashing
- **Helmet** & **CORS** for secure HTTP headers and cross-origin security
- **Express Rate Limit** to protect authentication endpoints against brute-force attacks
- **Vitest** for unit and integration test suites

---

## 3. Project Structure

```
wtl-inventory/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Button, Input, Select, Modal, Badge, Toast, Spinner, EmptyState
│   │   │   ├── layout/       # Sidebar, Header, AppLayout
│   │   │   ├── pos/          # ProductCard, CartItem, BillSummary, InvoiceModal
│   │   │   └── inventory/    # ProductModal, StockModal
│   │   ├── context/          # AuthContext, SettingsContext
│   │   ├── pages/            # LoginPage, DashboardPage, PosPage, InventoryPage, SalesHistoryPage, ReportsPage, SettingsPage
│   │   ├── services/         # Typed API clients (auth, products, sales, dashboard, reports, settings)
│   │   ├── types/            # Shared TypeScript interfaces
│   │   ├── utils/            # format.ts, csv.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/
│   ├── src/
│   │   ├── config/           # db.ts, env.ts
│   │   ├── controllers/      # auth, product, sale, dashboard, report, settings
│   │   ├── middleware/       # auth, errorHandler, validate
│   │   ├── models/           # User, Product, Sale, StockAdjustment, Settings
│   │   ├── routes/           # authRoutes, productRoutes, saleRoutes, dashboardRoutes, reportRoutes, settingsRoutes
│   │   ├── scripts/          # seed.ts (seeds realistic mobile shop catalogue & sample sales)
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # money.ts, invoice.ts
│   │   ├── validators/       # Zod schemas
│   │   ├── __tests__/        # Vitest unit and integration test suites
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env
├── .gitignore
└── README.md
```

---

## 4. Getting Started Locally

### Prerequisites
- **Node.js** (v18.0.0 or higher; v22 recommended)
- **MongoDB** (Local instance on `mongodb://localhost:27017` or a MongoDB Atlas cluster URI)

### Step 1: Clone and Configure Environment

```bash
# In the server directory
cd server
cp .env.example .env
```

Verify your `server/.env` parameters:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wtl_inventory
JWT_SECRET=wtl_inventory_jwt_secure_secret_key_change_in_production_32chars
CLIENT_URL=http://localhost:5173
```

### Step 2: Install Dependencies

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### Step 3: Seed Catalogue and Initial Owner

Run the database seeder to configure default shop settings (18% GST enabled, INR currency), create the primary store owner account, and populate 33 realistic mobile phone and accessory catalogue items:

```bash
cd server
npm run seed
```

**Default Owner Credentials:**
- **Email**: `owner@wtlmobile.com`
- **Password**: `adminPassword123!`

*(Note: The login page includes a one-click "Fill Demo Credentials" button for testing).*

### Step 4: Run Development Servers

In terminal 1 (Backend):
```bash
cd server
npm run dev
# Starts backend at http://localhost:5000
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
# Starts Vite dev server at http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 5. Automated Testing

The backend includes comprehensive unit and integration test suites covering monetary math, atomic stock decrements, idempotency, and insufficient stock handling:

```bash
cd server
npm test
```

Test coverage includes:
- **`src/__tests__/business.test.ts`**: Verifies exact integer paise conversion, Indian currency formatting, discount rules (% and fixed), and tax calculations.
- **`src/__tests__/saleIntegration.test.ts`**: Verifies atomic stock deduction against MongoDB, duplicate submission rejection using idempotency keys, and stock rollback on failed transactions.

---

## 6. Production Build & Deployment

### Building Client
```bash
cd client
npm run build
# Compiles static bundle to client/dist/
```

### Building Server
```bash
cd server
npm run build
# Compiles TypeScript to server/dist/
```

### Running Server in Production
```bash
cd server
NODE_ENV=production npm start
```

### Deployment Strategy
1. **Frontend**: Deploy `client/dist/` to any static hosting service (Cloudflare Pages, Vercel, Netlify, or AWS S3 + CloudFront). Configure `VITE_API_BASE_URL` to point to your live backend domain (e.g., `https://api.yourstoredomain.com/api`).
2. **Backend**: Deploy `server/` to Node.js platforms (Render, Railway, Fly.io, AWS Elastic Beanstalk, or a VPS with PM2). Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`).
3. **Database**: Use a free or dedicated cluster on MongoDB Atlas. In Atlas, configure Network Access with your server's IP.

---

## 7. Key REST API Endpoints

### Authentication
- `POST /api/auth/login`: Login with email and password (rate limited). Sets secure HttpOnly cookie and returns Bearer token.
- `POST /api/auth/logout`: Clears cookie session.
- `GET /api/auth/me`: Retrieves currently authenticated user.

### Products & Inventory
- `GET /api/products`: Paginated product catalogue with query filters (`search`, `category`, `stockStatus`, `sortBy`).
- `GET /api/products/categories`: Retrieves list of distinct categories.
- `GET /api/products/:id`: Retrieves single product details.
- `POST /api/products`: Creates a new product.
- `PATCH /api/products/:id`: Updates product specifications or prices.
- `PATCH /api/products/:id/stock`: Manually adjusts stock quantity and writes an audit log (`RESTOCK`, `MANUAL_CORRECTION`, `DAMAGE_WRITE_OFF`).
- `PATCH /api/products/:id/archive`: Toggles soft archive status without breaking historical sales.

### Sales & POS Billing
- `POST /api/sales`: Atomically creates a sale, generates an invoice number (`WTL-YYYYMM-XXXXX`), verifies stock, applies discounts/taxes, and reduces inventory. Supports idempotency key deduplication.
- `GET /api/sales`: Paginated sales history with filters for date range, payment method, and invoice number.
- `GET /api/sales/:id`: Fetches complete invoice with immutable line items.

### Dashboard & Analytics
- `GET /api/dashboard/summary`: Returns today's sales revenue, bill count, catalogue count, and low-stock count.
- `GET /api/dashboard/sales-overview`: Returns daily revenue and invoice counts for the last 7 or 30 days.
- `GET /api/dashboard/low-stock`: Returns products at or below their low-stock thresholds.
- `GET /api/dashboard/recent-sales`: Returns the most recent 5 completed sales.

### Reports
- `GET /api/reports`: Aggregates total revenue, gross profit (from historical purchase costs), units sold, payment method distribution, and top 10 best-selling products.

### Settings
- `GET /api/settings`: Returns store profile, tax rules, and invoice configurations.
- `PATCH /api/settings`: Updates shop settings.
