---
trigger: always_on
---

Workspace: FoodSavvy – Full-Stack Meal Prep App

This workspace contains a full-stack app for a weekly meal-prep and catering business:

client/ – React + Vite + Tailwind + Material UI (admin). Routes include landing (/), cart (/cart), order confirmation (/order-confirmation), and admin (/admin/\*). Cart is managed via context; admin auth uses a JWT stored in localStorage.

server/ – Node + Express + Prisma + Stripe + Resend. Public API under /api/_, admin API under /api/admin/_, Stripe webhook at /webhook. Prisma models cover menus, menu items, variants, add-ons, orders, delivery settings, catering orders, etc.

Primary goals:

Finish and polish the existing implementation instead of rewriting it.

Complete the customer checkout flow (Cart → Pickup/Delivery selection → Checkout form → Stripe payment → Order confirmation).

Fix known bugs (catering hardcoded URL, admin category update method mismatch, redundant Prisma client instances, unused deps).

Improve code structure, documentation, and UI/UX while preserving the current architecture and Stripe webhook flow.

Treat the Stripe webhook order creation, admin JWT-protected routes, and capacity logic as invariants that must not be broken.
