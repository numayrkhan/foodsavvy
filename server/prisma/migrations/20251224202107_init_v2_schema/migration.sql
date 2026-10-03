-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'employee', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('EVERYDAY', 'LUNCH', 'DINNER', 'SPECIAL', 'WEEKLY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('delivery', 'pickup');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('web', 'admin', 'phone', 'whatsapp', 'ai');

-- CreateEnum
CREATE TYPE "OrderCheckoutStatus" AS ENUM ('draft', 'submitted', 'cancelled');

-- CreateEnum
CREATE TYPE "FulfillmentGroupStatus" AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DeliveryPricingMode" AS ENUM ('per_order_bundled', 'per_fulfillment_group');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('delivery_fee', 'discount', 'tax', 'tip', 'service_fee', 'manual_adjustment');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'manual');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe_card', 'cash', 'cashapp', 'zelle', 'venmo', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "HoldStatus" AS ENUM ('active', 'released', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('fixed', 'percent');

-- CreateEnum
CREATE TYPE "RewardTxnType" AS ENUM ('earn', 'spend', 'adjust');

-- CreateEnum
CREATE TYPE "CateringStatus" AS ENUM ('requested', 'approved', 'preparing', 'ready', 'delivered', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "google_id" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "nutrition" JSONB,
    "allergens" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuVariant" (
    "id" SERIAL NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "base_price_cents" INTEGER NOT NULL,
    "base_capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "prep_minutes" INTEGER,
    "packaging_cost_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price_cents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemAddOn" (
    "menu_item_id" INTEGER NOT NULL,
    "add_on_id" INTEGER NOT NULL,
    "max_qty_per_item" INTEGER,

    CONSTRAINT "MenuItemAddOn_pkey" PRIMARY KEY ("menu_item_id","add_on_id")
);

-- CreateTable
CREATE TABLE "ServiceDay" (
    "id" SERIAL NOT NULL,
    "menu_date" TIMESTAMP(3) NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closed_reason" TEXT,
    "ordering_cutoff_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "service_day_id" INTEGER NOT NULL,
    "menuType" "MenuType" NOT NULL DEFAULT 'EVERYDAY',
    "title" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuOffering" (
    "id" SERIAL NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "menu_variant_id" INTEGER NOT NULL,
    "price_override_cents" INTEGER,
    "capacity_override" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "max_per_order" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "timezone" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTemplate" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "defaultCapacity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlotTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSlot" (
    "id" SERIAL NOT NULL,
    "service_day_id" INTEGER NOT NULL,
    "slot_template_id" INTEGER NOT NULL,
    "fulfillment_type" "FulfillmentType" NOT NULL,
    "pickup_location_id" INTEGER,
    "slot_key" TEXT NOT NULL,
    "capacity_override" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "origin_address" TEXT NOT NULL,
    "origin_lat" DOUBLE PRECISION,
    "origin_lng" DOUBLE PRECISION,
    "max_radius_miles" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "fee_tiers" JSONB NOT NULL,
    "bundle_policy" JSONB,
    "pricing_mode" "DeliveryPricingMode" NOT NULL DEFAULT 'per_order_bundled',
    "rate_cents_per_mile" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "created_by_user_id" INTEGER,
    "source" "OrderSource" NOT NULL DEFAULT 'web',
    "source_ref" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "checkout_status" "OrderCheckoutStatus" NOT NULL DEFAULT 'draft',
    "delivery_pricing_mode" "DeliveryPricingMode" NOT NULL DEFAULT 'per_order_bundled',
    "fulfillment_type" "FulfillmentType",
    "pickup_location_id" INTEGER,
    "delivery_address_id" INTEGER,
    "delivery_distance_miles" DOUBLE PRECISION,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "customer_notes" TEXT,
    "internal_notes" TEXT,
    "subtotal_cents" INTEGER NOT NULL DEFAULT 0,
    "adjustments_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "refunded_cents" INTEGER NOT NULL DEFAULT 0,
    "placed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentGroup" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "service_day_id" INTEGER NOT NULL,
    "service_slot_id" INTEGER,
    "status" "FulfillmentGroupStatus" NOT NULL DEFAULT 'pending',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "fulfillment_group_id" INTEGER NOT NULL,
    "menu_variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "variant_label_snapshot" TEXT NOT NULL,
    "image_url_snapshot" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemAddOn" (
    "id" SERIAL NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "add_on_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "name_snapshot" TEXT NOT NULL,

    CONSTRAINT "OrderItemAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAdjustment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "fulfillment_group_id" INTEGER,
    "type" "AdjustmentType" NOT NULL,
    "label" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'manual',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "provider_ref" TEXT,
    "received_by_user_id" INTEGER,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "fulfillment_group_id" INTEGER,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityHold" (
    "id" SERIAL NOT NULL,
    "menu_offering_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "status" "HoldStatus" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapacityHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "amount_cents" INTEGER,
    "percent_bps" INTEGER,
    "min_subtotal_cents" INTEGER,
    "max_redemptions" INTEGER,
    "per_user_limit" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" SERIAL NOT NULL,
    "promotion_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "discount_cents_applied" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardAccount" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" SERIAL NOT NULL,
    "reward_account_id" INTEGER NOT NULL,
    "type" "RewardTxnType" NOT NULL,
    "amount_points" INTEGER NOT NULL,
    "order_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringOrder" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "created_by_user_id" INTEGER,
    "source" "OrderSource" NOT NULL DEFAULT 'web',
    "source_ref" TEXT,
    "status" "CateringStatus" NOT NULL DEFAULT 'requested',
    "event_date" TIMESTAMP(3) NOT NULL,
    "guest_count" INTEGER NOT NULL,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "notes" TEXT,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringItem" (
    "id" SERIAL NOT NULL,
    "catering_order_id" INTEGER NOT NULL,
    "menu_item_id" INTEGER,
    "name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "CateringItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "MenuItem_category_id_idx" ON "MenuItem"("category_id");

-- CreateIndex
CREATE INDEX "MenuItem_isActive_idx" ON "MenuItem"("isActive");

-- CreateIndex
CREATE INDEX "MenuVariant_menu_item_id_idx" ON "MenuVariant"("menu_item_id");

-- CreateIndex
CREATE INDEX "MenuVariant_isActive_idx" ON "MenuVariant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDay_service_date_key" ON "ServiceDay"("service_date");

-- CreateIndex
CREATE INDEX "ServiceDay_menu_date_idx" ON "ServiceDay"("menu_date");

-- CreateIndex
CREATE INDEX "ServiceDay_isPublished_idx" ON "ServiceDay"("isPublished");

-- CreateIndex
CREATE INDEX "ServiceDay_isClosed_idx" ON "ServiceDay"("isClosed");

-- CreateIndex
CREATE INDEX "Menu_menuType_idx" ON "Menu"("menuType");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_service_day_id_menuType_key" ON "Menu"("service_day_id", "menuType");

-- CreateIndex
CREATE INDEX "MenuOffering_menu_id_position_idx" ON "MenuOffering"("menu_id", "position");

-- CreateIndex
CREATE INDEX "MenuOffering_menu_variant_id_idx" ON "MenuOffering"("menu_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "MenuOffering_menu_id_menu_variant_id_key" ON "MenuOffering"("menu_id", "menu_variant_id");

-- CreateIndex
CREATE INDEX "PickupLocation_isActive_idx" ON "PickupLocation"("isActive");

-- CreateIndex
CREATE INDEX "Address_user_id_idx" ON "Address"("user_id");

-- CreateIndex
CREATE INDEX "SlotTemplate_isActive_idx" ON "SlotTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlot_slot_key_key" ON "ServiceSlot"("slot_key");

-- CreateIndex
CREATE INDEX "ServiceSlot_service_day_id_fulfillment_type_idx" ON "ServiceSlot"("service_day_id", "fulfillment_type");

-- CreateIndex
CREATE INDEX "Order_user_id_idx" ON "Order"("user_id");

-- CreateIndex
CREATE INDEX "Order_created_by_user_id_idx" ON "Order"("created_by_user_id");

-- CreateIndex
CREATE INDEX "Order_checkout_status_idx" ON "Order"("checkout_status");

-- CreateIndex
CREATE INDEX "Order_source_idx" ON "Order"("source");

-- CreateIndex
CREATE INDEX "Order_placed_at_idx" ON "Order"("placed_at");

-- CreateIndex
CREATE INDEX "FulfillmentGroup_service_day_id_idx" ON "FulfillmentGroup"("service_day_id");

-- CreateIndex
CREATE INDEX "FulfillmentGroup_status_idx" ON "FulfillmentGroup"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentGroup_order_id_service_day_id_key" ON "FulfillmentGroup"("order_id", "service_day_id");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_fulfillment_group_id_idx" ON "OrderItem"("fulfillment_group_id");

-- CreateIndex
CREATE INDEX "OrderItem_menu_variant_id_idx" ON "OrderItem"("menu_variant_id");

-- CreateIndex
CREATE INDEX "OrderItemAddOn_order_item_id_idx" ON "OrderItemAddOn"("order_item_id");

-- CreateIndex
CREATE INDEX "OrderAdjustment_order_id_idx" ON "OrderAdjustment"("order_id");

-- CreateIndex
CREATE INDEX "OrderAdjustment_fulfillment_group_id_idx" ON "OrderAdjustment"("fulfillment_group_id");

-- CreateIndex
CREATE INDEX "OrderAdjustment_type_idx" ON "OrderAdjustment"("type");

-- CreateIndex
CREATE INDEX "Payment_order_id_idx" ON "Payment"("order_id");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "OrderEvent_order_id_idx" ON "OrderEvent"("order_id");

-- CreateIndex
CREATE INDEX "OrderEvent_fulfillment_group_id_idx" ON "OrderEvent"("fulfillment_group_id");

-- CreateIndex
CREATE INDEX "CapacityHold_menu_offering_id_idx" ON "CapacityHold"("menu_offering_id");

-- CreateIndex
CREATE INDEX "CapacityHold_order_id_idx" ON "CapacityHold"("order_id");

-- CreateIndex
CREATE INDEX "CapacityHold_expires_at_idx" ON "CapacityHold"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_is_active_idx" ON "Promotion"("is_active");

-- CreateIndex
CREATE INDEX "Promotion_starts_at_idx" ON "Promotion"("starts_at");

-- CreateIndex
CREATE INDEX "PromotionRedemption_user_id_idx" ON "PromotionRedemption"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_promotion_id_order_id_key" ON "PromotionRedemption"("promotion_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "RewardAccount_user_id_key" ON "RewardAccount"("user_id");

-- CreateIndex
CREATE INDEX "RewardTransaction_reward_account_id_idx" ON "RewardTransaction"("reward_account_id");

-- CreateIndex
CREATE INDEX "RewardTransaction_order_id_idx" ON "RewardTransaction"("order_id");

-- CreateIndex
CREATE INDEX "CateringItem_catering_order_id_idx" ON "CateringItem"("catering_order_id");

-- CreateIndex
CREATE INDEX "Review_order_id_idx" ON "Review"("order_id");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuVariant" ADD CONSTRAINT "MenuVariant_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_service_day_id_fkey" FOREIGN KEY ("service_day_id") REFERENCES "ServiceDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOffering" ADD CONSTRAINT "MenuOffering_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOffering" ADD CONSTRAINT "MenuOffering_menu_variant_id_fkey" FOREIGN KEY ("menu_variant_id") REFERENCES "MenuVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSlot" ADD CONSTRAINT "ServiceSlot_service_day_id_fkey" FOREIGN KEY ("service_day_id") REFERENCES "ServiceDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSlot" ADD CONSTRAINT "ServiceSlot_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "SlotTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSlot" ADD CONSTRAINT "ServiceSlot_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentGroup" ADD CONSTRAINT "FulfillmentGroup_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentGroup" ADD CONSTRAINT "FulfillmentGroup_service_day_id_fkey" FOREIGN KEY ("service_day_id") REFERENCES "ServiceDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentGroup" ADD CONSTRAINT "FulfillmentGroup_service_slot_id_fkey" FOREIGN KEY ("service_slot_id") REFERENCES "ServiceSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fulfillment_group_id_fkey" FOREIGN KEY ("fulfillment_group_id") REFERENCES "FulfillmentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menu_variant_id_fkey" FOREIGN KEY ("menu_variant_id") REFERENCES "MenuVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemAddOn" ADD CONSTRAINT "OrderItemAddOn_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemAddOn" ADD CONSTRAINT "OrderItemAddOn_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "AddOn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAdjustment" ADD CONSTRAINT "OrderAdjustment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAdjustment" ADD CONSTRAINT "OrderAdjustment_fulfillment_group_id_fkey" FOREIGN KEY ("fulfillment_group_id") REFERENCES "FulfillmentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_fulfillment_group_id_fkey" FOREIGN KEY ("fulfillment_group_id") REFERENCES "FulfillmentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityHold" ADD CONSTRAINT "CapacityHold_menu_offering_id_fkey" FOREIGN KEY ("menu_offering_id") REFERENCES "MenuOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityHold" ADD CONSTRAINT "CapacityHold_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardAccount" ADD CONSTRAINT "RewardAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_reward_account_id_fkey" FOREIGN KEY ("reward_account_id") REFERENCES "RewardAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringOrder" ADD CONSTRAINT "CateringOrder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringOrder" ADD CONSTRAINT "CateringOrder_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringItem" ADD CONSTRAINT "CateringItem_catering_order_id_fkey" FOREIGN KEY ("catering_order_id") REFERENCES "CateringOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringItem" ADD CONSTRAINT "CateringItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
