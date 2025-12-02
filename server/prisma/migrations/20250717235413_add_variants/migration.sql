-- CreateTable
CREATE TABLE "MenuVariant" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "MenuVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuVariant" ADD CONSTRAINT "MenuVariant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
