# Prisma & Database Guidelines

These rules govern how to evolve and use the Prisma schema and DB in FoodSavvy.

---

## 1. General Principles

- The existing schema is **authoritative**. Do not make breaking changes lightly.
- All schema changes must be accompanied by:
  - A migration (`prisma migrate`).
  - Any necessary seed script updates.
  - Code updates to keep API behavior consistent.

---

## 2. Naming & Mapping Conventions

- Model names are **PascalCase** (e.g. `MenuItem`, `OrderItem`).
- Fields are **camelCase** in the Prisma schema.
- Underlying DB columns may use `snake_case` via `@map("column_name")`.
  - Preserve this mapping approach for new fields where appropriate.

Example:

```prisma
model MenuItem {
  id        Int    @id @default(autoincrement())
  imageUrl  String @map("image_url")
}
```
