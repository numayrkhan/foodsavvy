-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "address" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;
