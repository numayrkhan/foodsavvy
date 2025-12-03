# FoodSavvy Architecture

## Overview

FoodSavvy is a classic SPA + API architecture:

- **Frontend**: React + Vite SPA (customer + admin), served by Vite dev server in development
  and as a static build in production.
- **Backend**: Express server exposing REST APIs + a Stripe webhook endpoint.
- **Database**: PostgreSQL accessed via Prisma ORM.
- **Third-party services**:
  - Stripe (payments)
  - Resend + React Email (transactional emails)

Communication is via JSON over HTTP. The frontend talks to the backend only via REST
endpoints and does not access the database directly.

---

## Project Layout

- `client/`

  - React SPA with routes for:
    - Landing page (`/`)
    - Cart (`/cart`)
    - Checkout (`/checkout`) – to be completed
    - Order confirmation (`/order-confirmation`)
    - Admin (`/admin/*`)
  - Uses:
    - Tailwind for styling
    - Material UI for admin dashboard components
    - React Router
    - Context for cart + admin auth

- `server/`
  - Express app with route groups:
    - Public `/api/*` (menus, availability, payment intent, catering)
    - Admin `/api/admin/*` (secure via JWT)
    - Stripe webhook `/webhook`
  - Uses Prisma to talk to PostgreSQL.
  - Serves static uploads from `server/uploads`.

---

## Data Model (High-Level)

The Prisma schema roughly includes:

- **User**

  - `id`, `name`, `email`, optional `phone`
  - `role` enum: `customer`, `employee`, `manager`, `admin`, etc.
  - Optional `googleId` for future OAuth
  - Relations: `orders`, `cateringOrders`, etc.

- **Menu**

  - Represents either:
    - A **template menu** for a weekday (e.g. “Monday template”), or
    - A **concrete menu** for a specific week (`weekOf` date).
  - Fields:
    - `weekday` (enum or int)
    - `isTemplate` (boolean)
    - `weekOf` (optional date)
  - Relations:
    - `items` (MenuItem[])

- **MenuItem**

  - Belongs to a Menu and a Category.
  - Fields: `name`, `description`, `imageUrl`, `isArchived`, capacity / flags.
  - Relations:
    - `variants` (MenuVariant[])
    - `addons` via join table `MenuItemAddOns`.

- **MenuVariant**

  - `label` (e.g. “Small”, “Large”)
  - `priceCents` (integer)
  - Belongs to a MenuItem.

- **AddOn**

  - Stand-alone add-on / side item.
  - Fields: `name`, `description`, `imageUrl`, `priceCents`.
  - Linked to menu items via `MenuItemAddOns`.

- **Category**

  - Simple name + relation to MenuItems.

- **Order**

  - Fields:
    - Customer details: `name`, `email`, `phone`, `address` (for delivery)
    - Payment details: `stripePaymentIntentId`, `totalCents`, `refundedCents`
    - Fulfillment details: `fulfillmentType` (pickup/delivery), `status` enum
  - Relations:
    - `items` (OrderItem[])
    - `deliveryGroups` (optional, for multi-day deliveries)

- **OrderItem**

  - Fields:
    - `quantity`
    - Captured item and variant data at time of order (denormalized)
  - Relations:
    - `order`
    - `addons` (OrderAddOn[])
    - Optional `deliveryGroup`.

- **DeliveryGroup**

  - Used to group items by service date/time when a single order spans multiple days.

- **DeliverySettings**

  - Origin address, delivery radius, fees, etc.

- **SlotTemplate**

  - Template time slots for a given day (e.g. “6–7 PM”, capacity per slot).

- **BlackoutDate**

  - Explicit dates when deliveries are disabled.

- **CateringOrder / CateringItem**

  - Records large catering requests (customer info + requested items/dates).

- **Inventory, Supplier, Promotion, Review**
  - Additional tables for future functionality (may be partially unused in current UI).

See `schema.prisma` for exact definitions.

---

## Key Application Flows

### 1. Public Menu & Availability

1. Client requests `GET /api/menus/by-day?weekday=MONDAY&date=YYYY-MM-DD`.
2. Server:
   - Loads the template menu for the weekday.
   - Optionally materializes concrete menus for a specific week.
   - Joins items, variants, and linked add-ons.
   - Calculates remaining capacity per item for the date (based on existing orders).
3. Client renders menu with item cards, variants, add-on options.

For slot availability, client calls:

- `GET /api/availability?date=YYYY-MM-DD` to see which slots are full.

### 2. Cart & Checkout

1. Cart state is managed via `cart-context` in the frontend.
2. On checkout:
   - User chooses `pickup` or `delivery` and a date/slot (for delivery).
   - Client submits details to `POST /api/create-payment-intent`:
     - Cart items + add-ons
     - Fulfillment type / date / slot
     - Customer info (name/email, etc.)
3. Server:
   - Validates capacity.
   - Creates a Stripe PaymentIntent with:
     - Amount = computed total
     - Metadata describing order payload.
   - Returns `clientSecret` to the frontend.
4. Client:

   - Uses Stripe Elements to confirm card payment.
   - On success, navigates to `/order-confirmation`.

5. Stripe webhook (`POST /webhook`):
   - Verifies signature using `STRIPE_WEBHOOK_SECRET`.
   - On `payment_intent.succeeded`:
     - Reads metadata from PaymentIntent.
     - Creates `Order`, `OrderItem`, and `OrderAddOn` records using Prisma.
     - Optionally creates `DeliveryGroup` entries.
     - Sends confirmation email via Resend.
   - Marks order email as sent and sets status accordingly.

### 3. Catering Flow

- Public form posts to `POST /api/catering/orders` (relative URL).
- Backend:
  - Creates a guest `User` if needed.
  - Persists a `CateringOrder` + related items.
- Admin can query catering orders via:
  - `GET /api/catering/orders`
  - `GET /api/catering/orders/:id`

### 4. Admin Authentication & Dashboard

- Login:
  - `POST /api/admin/login` with username/password.
  - Backend validates against env config and issues a JWT.
- Admin JWT is stored client-side (localStorage).
- All admin APIs use middleware that:
  - Reads `Authorization: Bearer <token>`.
  - Verifies token using `JWT_SECRET`.
  - Attaches admin context to `req`.

Admin features:

- **Orders**

  - `GET /api/admin/orders` for listing & detail.
  - `PATCH /api/admin/orders/:id` to update status.
  - `POST /api/admin/orders/:id/refund` to issue Stripe refund and update `refundedCents`.

- **Menus**

  - `GET /api/admin/menus/by-day?weekday=...` to fetch template menu.
  - `POST /api/admin/menus/item` to add/update a menu item.
  - `DELETE /api/admin/menus/:id` to archive/delete menu items.
  - `PUT /api/admin/menus/:id/variants` to replace variants.
  - `PUT /api/admin/menus/:id/addons` to link add-ons.

- **Categories & Add-Ons**

  - Standard CRUD under `/api/admin/categories` and `/api/admin/addons`.
  - Expect `PUT` for updates.

- **Uploads**

  - `POST /api/admin/uploads` with image file.
  - File saved under `server/uploads/`.
  - URL (e.g. `/uploads/filename`) stored in DB.
  - Express serves `/uploads/*` as static.

- **Delivery Config**
  - `GET /api/admin/delivery/config` returns:
    - `DeliverySettings`
    - `SlotTemplate` entries
    - `BlackoutDates`
  - Updates via `PUT /api/admin/delivery/settings`, `/slots`, `/blackouts`.

---

## Non-Functional Considerations

- **Performance**

  - Use Prisma’s `select` / `include` judiciously to avoid overfetching.
  - Add indexes on frequently queried fields (e.g. `Order.status`, `Order.deliveryDate`).

- **Security**

  - Admin routes are JWT-protected.
  - Consider migrating admin credentials to a real `Admin` table with hashed passwords
    for multi-admin support in the future.
  - For production, consider httpOnly cookies instead of localStorage for JWT.

- **Extensibility**
  - Built with future features in mind:
    - Multi-restaurant support
    - Subscriptions / recurring orders
    - Advanced inventory management
    - Promotions & reviews

For coding rules and refactor guidelines, see:

- `global-rules.md`
- `docs/agent-guidelines.md`
- `docs/prisma-guidelines.md`
