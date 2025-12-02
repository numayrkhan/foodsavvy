/*
  Warnings:

  - A unique constraint covering the columns `[serviceDay]` on the table `Menu` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Menu_serviceDay_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Menu_serviceDay_key" ON "public"."Menu"("serviceDay");
