# Codebase Overview

This document provides a high-level overview of the FoodSavvy repository structure, key modules, and data models.

## 1. Repository Structure

The project is a monorepo-style full-stack application with two main directories:

- **`client/`**: Frontend application (React + Vite).
- **`server/`**: Backend API (Express + Node.js).

### Key Directories

#### Client (`client/`)

- **`src/main.jsx`**: Entry point. Mounts the React app.
- **`src/App.jsx`**: Main application component and Router configuration.
- **`src/components/`**: Reusable UI components (Hero, Cart, MenuSection, etc.).
- **`src/pages/`**: (Note: The current structure seems to use components directly in routes or `src/admin/` for pages).
- **`src/admin/`**: Admin dashboard pages and layout.
- **`src/context/`**: React Context providers (likely for Cart and Auth).

#### Server (`server/`)

- **`index.js`**: Main entry point. Sets up Express, middleware, database connection, and mounts routes.
- **`routes/`**: API route definitions.
  - `routes/admin/`: Admin-specific routes (orders, menus, delivery, etc.).
- **`prisma/`**: Database configuration.
  - `schema.prisma`: The data model definition.
- **`auth/`**: Authentication logic (middleware).
- **`emails/`**: Email templates (likely React Email).

## 2. Major Flows & Modules

### Frontend (Client)

- **Public Customer Flow**:
  - **Landing Page (`/`)**: Displays Hero, Weekly Menu, How It Works, Testimonials.
  - **Cart (`/cart`)**: Manages selected items.
  - **Checkout**: (In progress) Users proceed from Cart to Checkout.
  - **Order Confirmation (`/order-confirmation`)**: Displays success message after payment.
- **Admin Dashboard (`/admin`)**:
  - Protected by `AdminAuthProvider`.
  - Manages Orders, Menus, Delivery Settings.

### Backend (Server)

- **Public API**:
  - `GET /api/menus/by-day`: Fetches the menu for a specific day.
  - `GET /api/availability`: Checks delivery slot availability.
  - `POST /api/create-payment-intent`: Initiates Stripe payment.
  - `POST /webhook`: Handles Stripe events (payment success) to create orders.
  - `POST /api/catering/orders`: Creates catering inquiries/orders.
- **Admin API (`/api/admin/*`)**:
  - Protected by JWT middleware (`authenticateAdminToken`).
  - Endpoints for managing Orders, Menus, Refunds, Uploads, and Delivery settings.

## 3. Data Models (Prisma)

Key models defined in `server/prisma/schema.prisma`:

- **`User`**: Stores customer and admin users.
- **`Menu`**: Represents a weekly menu (linked to `serviceDay` and `weekOf`).
- **`MenuItem`**: Items available on a menu. Linked to `Category` and `MenuVariant`.
- **`Order`**: Customer orders. Linked to `User`, `OrderItem`, `Delivery`, and `Payment`.
- **`CateringOrder`**: Separate entity for catering requests.
- **`DeliverySettings`**: Configuration for delivery radius and fees.
- **`SlotTemplate`**: Defines available delivery time slots.

## 4. Documentation Status

- `docs/architecture.md`: High-level architecture (seems consistent with findings).
- `docs/ui-ux-guidelines.md`: Styling rules.
- `docs/prisma-guidelines.md`: DB rules.

## Observations

- **Routing**: Frontend routing is centralized in `App.jsx`. Admin routes are nested under `/admin`.
- **API Structure**: Public routes are largely defined directly in `server/index.js` or mounted there, while admin routes are modularized in `server/routes/admin/`.
- **Stripe Integration**: Order creation logic is tightly coupled with the Stripe Webhook (`payment_intent.succeeded`) in `server/index.js`.
