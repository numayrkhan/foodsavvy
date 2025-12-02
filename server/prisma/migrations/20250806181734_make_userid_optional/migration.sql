-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
