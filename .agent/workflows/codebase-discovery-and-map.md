---
description: Learn the FoodSavvy codebase and create a code map
---

You are an expert full-stack engineer working in the FoodSavvy repo. Your goal in this task is not to change behavior, but to learn the codebase structure and record it in a doc we can reuse later.

Tools to use:

Use the filesystem MCP to read files and list directories.

If needed, use context7 for library docs (React, Prisma, Express), but do not change code yet.

Requirements:

Scan the repo structure

List the top-level directory structure of the repo (at least client/, server/, and any other important folders).

Within client/, identify:

The main entry file (e.g. main.jsx or main.tsx)

The main app/router file (e.g. App.jsx, router config, etc.)

Key directories: components/, pages/, admin/, context/, etc.

Within server/, identify:

The main entrypoint (e.g. index.js, app.js, or similar)

Where routes are defined (e.g. routes/\*.js)

Where Prisma is configured (e.g. prisma/schema.prisma, any db or prisma helper module).

Identify major flows & modules

For the frontend, identify:

Which components/pages implement:

Landing page

Weekly menu

Cart

Checkout / delivery form (even if incomplete)

Admin orders, menus, categories, add-ons, delivery settings

For the backend, identify:

Public routes: menus, availability, create-payment-intent, orders (and their paths).

Admin routes: orders, menus, categories, add-ons, delivery, catering.

Stripe webhook handler file and its main responsibilities.

Prisma models that look most important (menus, menu items, orders, delivery, catering).

Create a code map doc

Using filesystem MCP, create a new file:

docs/codebase-overview.md

In this file, write a concise but structured summary that includes:

High-level client/server structure.

Key entrypoints and route files (frontend + backend).

Key React components/pages and what they do.

Key API endpoints and what they return.

Key Prisma models and their relationships (only at a high level; don’t paste the entire schema).

Link or reference any existing docs you see (like README.md or docs/architecture.md) and note any mismatches between those docs and the actual code.

Do not change behavior yet

Do not modify any application logic in this task.

It’s okay to create or update documentation files only (docs/\*.md).

Report back

At the end, print a short summary listing:

The files you inspected.

The file you created (docs/codebase-overview.md).

Any major surprises or inconsistencies you noticed between code and docs (if any).
