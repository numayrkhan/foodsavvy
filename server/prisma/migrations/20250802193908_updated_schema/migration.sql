/*
  Warnings:

  - You are about to drop the column `assigned_at` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `delivered_at` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `distance_miles` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `driver_id` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `price_cents` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `menuItemId` on the `MenuVariant` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `MenuVariant` table. All the data in the column will be lost.
  - You are about to drop the column `amountCents` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_payment_intent_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `is_admin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Driver` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `CateringOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distance` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_item_id` to the `MenuVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_cents` to the `MenuVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `MenuVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount_cents` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('customer', 'employee', 'manager', 'admin');

-- DropForeignKey
ALTER TABLE "public"."Delivery" DROP CONSTRAINT "Delivery_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MenuVariant" DROP CONSTRAINT "MenuVariant_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropIndex
DROP INDEX "public"."Payment_orderId_key";

-- DropIndex
DROP INDEX "public"."Payment_stripe_payment_intent_id_key";

-- AlterTable
ALTER TABLE "public"."CateringOrder" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Delivery" DROP COLUMN "assigned_at",
DROP COLUMN "delivered_at",
DROP COLUMN "distance_miles",
DROP COLUMN "driver_id",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "distance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "zip" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Menu" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."MenuItem" DROP COLUMN "price_cents",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "image_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."MenuVariant" DROP COLUMN "menuItemId",
DROP COLUMN "priceCents",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "menu_item_id" INTEGER NOT NULL,
ADD COLUMN     "price_cents" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "amountCents",
DROP COLUMN "currency",
DROP COLUMN "orderId",
DROP COLUMN "stripe_payment_intent_id",
ADD COLUMN     "amount_cents" INTEGER NOT NULL,
ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "stripe_charge_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "is_admin",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'customer',
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Driver";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "reorder_level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_cents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "public"."Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_order_id_key" ON "public"."Payment"("order_id");

-- AddForeignKey
ALTER TABLE "public"."MenuVariant" ADD CONSTRAINT "MenuVariant_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
