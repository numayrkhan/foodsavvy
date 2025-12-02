/*
  Warnings:

  - You are about to drop the `WeeklyDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyDayItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MenuItemAddOns` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serviceDay,isTemplate]` on the table `Menu` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."WeeklyDayItem" DROP CONSTRAINT "WeeklyDayItem_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WeeklyDayItem" DROP CONSTRAINT "WeeklyDayItem_weeklyDayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_MenuItemAddOns" DROP CONSTRAINT "_MenuItemAddOns_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_MenuItemAddOns" DROP CONSTRAINT "_MenuItemAddOns_B_fkey";

-- DropIndex
DROP INDEX "public"."Menu_serviceDay_key";

-- AlterTable
ALTER TABLE "public"."Menu" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weekOf" TIMESTAMP(3),
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "serviceDay" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."WeeklyDay";

-- DropTable
DROP TABLE "public"."WeeklyDayItem";

-- DropTable
DROP TABLE "public"."_MenuItemAddOns";

-- CreateIndex
CREATE INDEX "Menu_serviceDay_weekOf_idx" ON "public"."Menu"("serviceDay", "weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_serviceDay_isTemplate_key" ON "public"."Menu"("serviceDay", "isTemplate");
