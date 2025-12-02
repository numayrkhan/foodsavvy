-- CreateTable
CREATE TABLE "CateringOrder" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "guest_count" INTEGER NOT NULL,
    "special_requests" TEXT,
    "status" "OrderStatus" NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CateringOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringItem" (
    "id" SERIAL NOT NULL,
    "catering_order_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,

    CONSTRAINT "CateringItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CateringOrder" ADD CONSTRAINT "CateringOrder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringItem" ADD CONSTRAINT "CateringItem_catering_order_id_fkey" FOREIGN KEY ("catering_order_id") REFERENCES "CateringOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
