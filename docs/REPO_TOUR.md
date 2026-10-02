# Repository Tour

## 1. System Overview

FoodSavvy is a full-stack meal prep and catering application. It allows customers to browse weekly menus, add items to a cart, and place orders with delivery or pickup options. Administrators manage menus, orders, and delivery settings via a secure dashboard.

## 2. Repository Map (High-Level)

```
/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── admin/          # Admin Dashboard Components & Pages
│   │   ├── components/     # Reusable UI Components
│   │   ├── context/        # React Context (Cart, Auth)
│   │   ├── main.jsx        # App Entry Point
│   │   └── App.jsx         # Routing & Layout
├── server/                 # Node + Express Backend
│   ├── prisma/             # Database Schema & Migrations
│   ├── routes/             # API Route Definitions
│   ├── index.js            # Server Entry Point & Webhook Handler
│   └── .env                # Server Environment Variables
├── docs/                   # Project Documentation
└── .agent/                 # Agent Rules & Workflows
```

## 3. Where to Start

### Entry Points

- **Frontend**: `client/src/main.jsx` boots the React app. `client/src/App.jsx` handles the main routing logic (public vs admin).
- **Backend**: `server/index.js` is the monolithic entry point. It sets up Express, connects to Prisma, handles the Stripe webhook, and mounts API routes.
- **Database**: `server/prisma/schema.prisma` is the source of truth for the data model.

### Key logic

- **Cart Logic**: `client/src/context/CartContext.jsx` (inferred).
- **Order Creation**: `server/index.js` (inside `payment_intent.succeeded` webhook).
- **Admin Auth**: `server/auth/` and `client/src/context/AdminAuthContext.jsx` (inferred).

## 4. Boundaries

- **Client/Server**: strictly separated. Client consumes JSON APIs primarily under `/api/`.
- **Factory/Product**: `server/prisma/seed.js` (if exists) or fixtures used for factory/seeding vs production data.
- **Dependencies**: `client/package.json` vs `server/package.json` are separate.

## 5. Runbook

_Standard commands for interacting with the system (PowerShell)._

### Setup

```powershell
# Install Client Dependencies
cd client
npm install

# Install Server Dependencies
cd ../server
npm install
```

### Database

```powershell
# Generate Prisma Client
cd server
npx prisma generate

# Push Schema to DB (Dev)
npx prisma db push
```

### Running

```powershell
# Run Backend (Port 3001)
cd server
npm run start # or node index.js

# Run Frontend (Port 5173)
cd client
npm run dev
```
