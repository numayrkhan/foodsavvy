# Contributing to FoodSavvy

This repo is currently primarily maintained by the project owner, but these
guidelines apply to both humans and AI assistants.

## 1. Getting Started

1. Read:
   - `README.md`
   - `docs/architecture.md`
   - `global-rules.md`
2. Set up your environment (Node, Postgres, Stripe keys, etc.).
3. Run the app locally and get familiar with:
   - Public menu & cart
   - Admin login and dashboard

## 2. Branching & Commits

If you use branches:

- Create feature branches from `main`:
  - `feat/checkout-flow`
  - `fix/admin-category-update`
- Use clear, descriptive commit messages. Conventional Commit style is
  recommended but not mandatory:

  - `feat: implement checkout page`
  - `fix: use PUT for category update`
  - `refactor: share prisma client instance`
  - `chore: remove unused passport dependency`

## 3. Development Workflow

Typical loop:

1. Pick a small task (bug fix, UI polish, missing piece).
2. Search the codebase to understand context.
3. Implement the change in both client and server if needed.
4. Run the app and manually verify behavior.
5. Update docs if behavior changed.
6. Open a PR (if using GitHub PRs) and describe:
   - What you changed
   - How you tested it
   - Any follow-up work needed

## 4. Coding Standards

- Follow style and practices in:
  - `global-rules.md`
  - `docs/agent-guidelines.md`
  - `docs/ui-ux-guidelines.md`
  - `docs/prisma-guidelines.md`

Key points:

- Keep functions small and focused.
- Prefer composition and clear data flow.
- Do not introduce large new dependencies without strong justification.

## 5. Testing

Currently, most validation will be manual:

- Public flow:
  - Browse menus
  - Add items to cart (with variants/add-ons)
  - Attempt checkout (once implemented)
- Admin:
  - Log in, view orders, change status, test refund
  - Manage menus, categories, add-ons
  - Update delivery settings and verify effect in UI

If/when automated tests are added:

- Follow the existing patterns (e.g. Jest, Cypress).
- Add tests for new features or bug fixes where possible.

## 6. Documentation

- Docs live under `docs/`.
- If you change behavior in a meaningful way, **update the docs**:
  - Architecture → `docs/architecture.md`
  - UI patterns → `docs/ui-ux-guidelines.md`
  - Prisma / DB behavior → `docs/prisma-guidelines.md`

Small code comments are encouraged for non-obvious logic.

## 7. Security & Secrets

- Never commit real API keys or secrets.
- Use `.env` files and ensure they are in `.gitignore`.
- Treat admin auth and Stripe webhook secrets carefully.

Thanks for helping improve FoodSavvy!
