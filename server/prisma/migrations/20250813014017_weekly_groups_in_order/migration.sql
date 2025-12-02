-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "delivery_group_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."WeeklyDay" (
    "id" SERIAL NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyDayItem" (
    "id" SERIAL NOT NULL,
    "weeklyDayId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,

    CONSTRAINT "WeeklyDayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryGroup" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "slot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDay_date_key" ON "public"."WeeklyDay"("date");

-- CreateIndex
CREATE INDEX "WeeklyDay_weekOf_idx" ON "public"."WeeklyDay"("weekOf");

-- CreateIndex
CREATE INDEX "WeeklyDayItem_menuItemId_idx" ON "public"."WeeklyDayItem"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDayItem_weeklyDayId_menuItemId_key" ON "public"."WeeklyDayItem"("weeklyDayId", "menuItemId");

-- CreateIndex
CREATE INDEX "DeliveryGroup_order_id_idx" ON "public"."DeliveryGroup"("order_id");

-- CreateIndex
CREATE INDEX "DeliveryGroup_service_date_idx" ON "public"."DeliveryGroup"("service_date");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "public"."OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_delivery_group_id_idx" ON "public"."OrderItem"("delivery_group_id");

-- AddForeignKey
ALTER TABLE "public"."WeeklyDayItem" ADD CONSTRAINT "WeeklyDayItem_weeklyDayId_fkey" FOREIGN KEY ("weeklyDayId") REFERENCES "public"."WeeklyDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyDayItem" ADD CONSTRAINT "WeeklyDayItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_delivery_group_id_fkey" FOREIGN KEY ("delivery_group_id") REFERENCES "public"."DeliveryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryGroup" ADD CONSTRAINT "DeliveryGroup_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
