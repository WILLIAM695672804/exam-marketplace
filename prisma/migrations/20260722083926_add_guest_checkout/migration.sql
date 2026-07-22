-- CreateEnum
CREATE TYPE "OrderOwnerType" AS ENUM ('USER', 'GUEST');

-- DropForeignKey
ALTER TABLE "downloads" DROP CONSTRAINT "downloads_userId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- AlterTable
ALTER TABLE "downloads" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "ownerType" "OrderOwnerType" NOT NULL DEFAULT 'USER',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "orders_guestEmail_idx" ON "orders"("guestEmail");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
