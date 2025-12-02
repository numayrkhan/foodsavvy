-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "delivery_date" TIMESTAMP(3),
ADD COLUMN     "delivery_slot" TEXT;
