-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "refunded_cents" INTEGER NOT NULL DEFAULT 0;
