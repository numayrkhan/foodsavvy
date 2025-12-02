/*
  Warnings:

  - Made the column `updated_at` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "category_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AddOn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "image_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItemAddOns" (
    "menuItemId" INTEGER NOT NULL,
    "addOnId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemAddOns_pkey" PRIMARY KEY ("menuItemId","addOnId")
);

-- CreateTable
CREATE TABLE "public"."_MenuItemAddOns" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MenuItemAddOns_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "_MenuItemAddOns_B_index" ON "public"."_MenuItemAddOns"("B");

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItemAddOns" ADD CONSTRAINT "MenuItemAddOns_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItemAddOns" ADD CONSTRAINT "MenuItemAddOns_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "public"."AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuItemAddOns" ADD CONSTRAINT "_MenuItemAddOns_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuItemAddOns" ADD CONSTRAINT "_MenuItemAddOns_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
