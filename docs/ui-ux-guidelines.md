# UI & UX Guidelines

These guidelines ensure the FoodSavvy UI stays consistent and maintainable across
customer and admin surfaces.

---

## 1. Design Language

- **Theme**
  - Dark background for most surfaces.
  - Green accent color for primary actions (buttons, highlights).
- **Typography**
  - Use the fonts defined in the existing MUI theme and Tailwind config.
  - Headings: bolder, larger; body: clean sans-serif with good line height.
- **Spacing**
  - Use consistent spacing scale (e.g. Tailwind’s `space-y-*`, `p-*`, `m-*` utilities).
  - Avoid magic numbers in inline styles; prefer Tailwind utilities or theme spacing.

---

## 2. Customer-Facing UI (Landing, Menu, Cart, Checkout)

- **Layout**

  - Landing page uses a stacked layout:
    - Hero section
    - Weekly menu section
    - How it works
    - Testimonials
    - Catering
  - Use Tailwind’s `flex`, `grid`, and responsive classes (`sm:`, `md:`, `lg:`).

- **Weekly Menu**

  - Ensure weekday filter / tabs are clear and easy to tap on mobile.
  - Show:
    - Item name
    - Description
    - Price (primary variant)
    - Indicators (e.g. “Sold out”, “Limited”, “Archived”).
  - Add-ons should be clearly labeled and priced.

- **Cart & Checkout**

  - Cart must show:
    - Items + variants
    - Add-ons
    - Quantities
    - Subtotals and total
  - Checkout flow:
    - Step 1: pickup vs delivery choice
    - Step 2: date/slot selection (if delivery)
    - Step 3: contact info + address (if delivery)
    - Step 4: payment (Stripe Elements)
  - Provide clear progress and errors, with buttons disabled when invalid.

- **Catering**
  - Use a simple form with labels above inputs.
  - Validate required fields client-side with user-friendly messages.
  - Use relative API URL (`/api/catering/orders`).

---

## 3. Admin Dashboard

- **Layout**

  - Sidebar navigation + top bar (as implemented).
  - On wide screens, sidebar is pinned; on narrow screens, sidebar collapses to
    a temporary drawer.
  - Wrap the app in MUI’s `ThemeProvider` using existing custom theme.

- **Components**

  - Use Material UI components for:
    - DataGrid (orders, menus, categories, add-ons)
    - Buttons
    - TextFields
    - Dialogs / Drawers / Snackbars
  - Use Tailwind for layout helpers (flex/grid/spacing), not for overriding
    basic MUI look unless clearly necessary.

- **Orders**

  - Main orders grid:
    - Columns: order ID, customer name, date, total, status, fulfillment type.
    - Row click opens details drawer.
  - Details drawer:
    - Show items, add-ons, and totals.
    - Provide controls to change status and trigger refunds.
  - Show toasts/snackbars for updates and errors.

- **Menus / Categories / Add-Ons**

  - Use tabs for Items / Categories / Add-Ons.
  - Ensure edit/add dialogs:
    - Use MUI dialogs.
    - Have clear “Save” / “Cancel” actions.
    - Validate required fields.

- **Delivery & Slots**
  - Present delivery settings with labeled fields.
  - Time slot editor should list slots clearly and explain capacity semantics.

---

## 4. Responsiveness

For both customer and admin:

- Test layouts at least at:
  - ~320px (small phones)
  - ~768px (tablets)
  - ~1024px+ (desktops)
- Avoid horizontal scroll where possible.
- DataGrid on small screens:
  - Allow horizontal scroll if necessary, but keep key columns visible.
  - Consider hiding less critical columns at very small breakpoints.

---

## 5. Accessibility

- **Forms**

  - Every input must have an associated `<label>` or `aria-label`.
  - Use `type="email"`, `type="tel"`, etc., when appropriate.

- **Images**

  - Provide meaningful `alt` text for product / hero images.
  - Use empty alt (`alt=""`) for decorative images.

- **Keyboard**

  - All interactive elements must be keyboard navigable.
  - Modals/dialogs should trap focus (Headless UI / MUI Dialog already help here).

- **Color & Contrast**
  - Ensure sufficient contrast between text and background (especially on dark theme).
  - Avoid relying solely on color to convey meaning (also use text/icons).

---

## 6. Feedback & Error Handling

- Use snackbars / toasts for:
  - Successful saves/updates.
  - Errors (network, validation).
- For forms:
  - Show inline validation errors near the relevant fields.
  - Disable submit buttons while requests are in flight.

---

## 7. Patterns to Follow / Avoid

- **Follow**

  - Existing component patterns in `client/src/admin/*` and `client/src/components/*`.
  - Use composition (small, reusable components) over monolithic pages.

- **Avoid**
  - Duplicating similar UI blocks; extract shared components instead.
  - Introducing new design systems or CSS frameworks.
  - Inline styles except for very small, one-off tweaks.

When unsure, match existing style and structure rather than introducing a new pattern.
