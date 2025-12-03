# FoodSavvy

FoodSavvy is a full-stack meal-prep and catering platform. Customers can order from a
weekly rotating menu (with per-day capacity limits), add extras, and submit catering
requests. Admins manage menus, orders, delivery settings, and catering from a dashboard.

## Features

**Customer side**

- Weekly menu by weekday (e.g. “Monday menu”, “Tuesday menu”)
- Menu items with:
  - Categories (e.g. mains, sides, desserts)
  - Variants (sizes / prices)
  - Add-ons (extras, sides, toppings)
- Cart with item + add-on selection
- Checkout flow:
  - Choose pickup vs delivery
  - Delivery date & time slot selection (capacity-aware)
  - Stripe card payment (via PaymentIntent + Elements)
- Catering request form

**Admin side**

- JWT-secured `/admin` dashboard
- Orders view
  - List all orders
  - View line items & add-ons
  - Update order status
  - Issue Stripe refunds
- Menu management
  - Weekday template menus
  - Items, categories, add-ons
  - Variants & linked add-ons per menu item
  - Archive vs delete logic for items with previous orders
- Delivery & slots
  - Origin address, radius, fees
  - Delivery time slot templates
  - Blackout dates / holidays
- Catering orders
  - List + inspect catering requests

**Integrations**

- **Stripe** – card payments via PaymentIntent + webhook
- **Resend + React Email** – transactional emails (order confirmation)
- **PostgreSQL + Prisma** – relational DB for menus/orders
- **React + Vite + Tailwind** – customer and admin UIs
- **Material UI** – admin dashboard components

---

## Tech Stack

- **Frontend**
  - React (Vite)
  - React Router
  - Tailwind CSS
  - Material UI (admin)
  - Headless UI (modals)
- **Backend**
  - Node.js + Express
  - Prisma ORM (PostgreSQL)
  - Stripe SDK
  - Resend + React Email
  - Multer (image uploads)
  - JSON Web Tokens (admin auth)

---

## Repository Structure

```text
client/                 # Vite + React frontend (customer + admin)
  src/
    components/         # Reusable components
    pages/              # Page-level components (landing, cart, admin pages, etc.)
    admin/              # Admin dashboard shell & views
    context/            # cart-context, admin auth context, etc.
  ...

server/                 # Express + Prisma API server
  prisma/
    schema.prisma       # Data models & relations
    seed.js             # Seed initial data (menus, etc.) (name may vary)
  src/ or routes/       # Route modules (public + /api/admin)
  uploads/              # Image uploads (served under /uploads)
  ...

docs/                   # Project documentation
  architecture.md
  ui-ux-guidelines.md
  prisma-guidelines.md
  agent-guidelines.md
  CONTRIBUTING.md         # Engineering guidelines
```
