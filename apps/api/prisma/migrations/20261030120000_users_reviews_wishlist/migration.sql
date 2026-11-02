-- Пользователи и роли, отзывы, избранное, история этапов заказа, новые поля товара и заказа.
-- Существующие данные переносятся: администратор из Admin — в User, срок изготовления — в число дней,
-- старые статусы заказов — в новые этапы, настройки — в JSON.

-- Новые перечисления
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT');
CREATE TYPE "Room" AS ENUM ('LIVING', 'BEDROOM', 'DINING', 'OFFICE', 'KIDS', 'HALLWAY');
CREATE TYPE "Badge" AS ENUM ('NONE', 'HIT', 'NEW');
CREATE TYPE "Payment" AS ENUM ('CASH', 'CARD');
ALTER TYPE "MaterialRole" ADD VALUE 'COLOR';
ALTER TYPE "MaterialType" ADD VALUE 'COLOR';

-- Пользователи. Администратор переезжает из таблицы Admin
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "defaultAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
INSERT INTO "User" ("email", "name", "passwordHash", "role")
SELECT "email", 'Администратор', "passwordHash", 'ADMIN' FROM "Admin";
DROP TABLE "Admin";

-- Товар: новые поля
ALTER TABLE "Product"
    ADD COLUMN "oldPrice" INTEGER,
    ADD COLUMN "room" "Room" NOT NULL DEFAULT 'LIVING',
    ADD COLUMN "badge" "Badge" NOT NULL DEFAULT 'NONE',
    ADD COLUMN "widthCm" INTEGER,
    ADD COLUMN "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- Ширина = ширина размера по умолчанию (или первого размера)
UPDATE "Product" p SET "widthCm" = COALESCE(
    (SELECT s."widthCm" FROM "ProductSize" s WHERE s."productId" = p."id" ORDER BY s."isDefault" DESC, s."id" LIMIT 1), 0);
ALTER TABLE "Product" ALTER COLUMN "widthCm" SET NOT NULL;

-- Комната — по старым категориям-комнатам
UPDATE "Product" p SET "room" = CASE c."slug" WHEN 'spalnya' THEN 'BEDROOM'::"Room" WHEN 'stolovaya' THEN 'DINING'::"Room" ELSE 'LIVING'::"Room" END
FROM "Category" c WHERE c."id" = p."categoryId";

-- Срок изготовления: «10–14 дней» → 14 (последнее число в тексте)
ALTER TABLE "Product" ALTER COLUMN "productionDays" TYPE INTEGER
    USING COALESCE((regexp_match("productionDays", '(\d+)\D*$'))[1]::INTEGER, 14);

-- Этапы заказа: CONFIRMED → NEW, IN_PRODUCTION → FRAME
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'FRAME', 'ASSEMBLY', 'UPHOLSTERY', 'DELIVERING', 'DONE', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
    CASE "status"::TEXT WHEN 'CONFIRMED' THEN 'NEW' WHEN 'IN_PRODUCTION' THEN 'FRAME' ELSE "status"::TEXT END
)::"OrderStatus_new";
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Заказ: новые поля. У старых заказов доставка считается бесплатной
ALTER TABLE "Order"
    ADD COLUMN "userId" INTEGER,
    ADD COLUMN "deliveryDate" DATE,
    ADD COLUMN "payment" "Payment" NOT NULL DEFAULT 'CASH',
    ADD COLUMN "subtotal" INTEGER,
    ADD COLUMN "deliveryPrice" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "adminNote" TEXT;
UPDATE "Order" SET "subtotal" = "total";
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET NOT NULL, ALTER COLUMN "deliveryPrice" DROP DEFAULT;
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Позиция заказа: тип мебели, цвет, отделка, опции. Старая позиция без товара — шкаф из конструктора
ALTER TABLE "OrderItem"
    ADD COLUMN "model3dKey" "Model3dKey",
    ADD COLUMN "colorMaterialId" INTEGER,
    ADD COLUMN "finishMaterialId" INTEGER,
    ADD COLUMN "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ALTER COLUMN "mainMaterialId" DROP NOT NULL;
UPDATE "OrderItem" i SET "model3dKey" = COALESCE((SELECT p."model3dKey" FROM "Product" p WHERE p."id" = i."productId"), 'wardrobe');
ALTER TABLE "OrderItem" ALTER COLUMN "model3dKey" SET NOT NULL;
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorMaterialId_fkey" FOREIGN KEY ("colorMaterialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_finishMaterialId_fkey" FOREIGN KEY ("finishMaterialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- История этапов заказа. Для старых заказов — одна запись с текущим этапом
CREATE TABLE "OrderStatusHistory" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" INTEGER,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "OrderStatusHistory" ("orderId", "status", "changedAt") SELECT "id", "status", "updatedAt" FROM "Order";

-- Избранное
CREATE TABLE "WishlistItem" (
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("userId", "productId")
);
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Отзывы: один отзыв на товар от одного пользователя
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_productId_idx" ON "Review"("productId");
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Настройки: число → JSON
ALTER TABLE "Setting" ALTER COLUMN "value" TYPE JSONB USING to_jsonb("value");
