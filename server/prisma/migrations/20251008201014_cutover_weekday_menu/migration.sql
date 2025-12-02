/*
  Warnings:

  - You are about to drop the column `expires_at` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `release_date` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Menu" DROP COLUMN "expires_at",
DROP COLUMN "release_date",
DROP COLUMN "type",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Menu',
ADD COLUMN     "serviceDay" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Menu_serviceDay_idx" ON "public"."Menu"("serviceDay");
