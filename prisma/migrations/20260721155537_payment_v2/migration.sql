-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'DOWNLOAD', 'ROLE_CHANGE', 'MASK', 'UNMASK', 'PAYMENT_INITIATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'WEBHOOK_RECEIVED', 'WEBHOOK_DUPLICATE', 'WEBHOOK_VERIFIED', 'WEBHOOK_SIGNATURE_INVALID', 'WEBHOOK_AMOUNT_MISMATCH', 'DOUBLE_CLICK_BLOCKED', 'DOUBLE_PAYMENT_BLOCKED', 'ORDER_OWNERSHIP_VIOLATION', 'COMMISSION_CALCULATED');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('FAPSHI', 'NOTCHPAY', 'CAMPAY', 'STRIPE');
ALTER TABLE "public"."transactions" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "public"."PaymentProvider_old";
ALTER TABLE "transactions" ALTER COLUMN "provider" SET DEFAULT 'FAPSHI';
COMMIT;

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING';

-- DropIndex
DROP INDEX "commissions_transactionId_key";

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "examPaperId" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "transactions" RENAME COLUMN "reference" TO "merchantReference";
ALTER TABLE "transactions"
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'XAF',
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastErrorBody" JSONB,
ADD COLUMN     "lastErrorCode" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "providerRef" TEXT,
ADD COLUMN     "providerTxId" TEXT,
ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'FAPSHI';

-- CreateIndex
CREATE INDEX "commissions_teacherId_idx" ON "commissions"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_providerTxId_key" ON "transactions"("providerTxId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_idempotencyKey_idx" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_providerTxId_idx" ON "transactions"("providerTxId");

-- CreateIndex
CREATE INDEX "transactions_status_initiatedAt_idx" ON "transactions"("status", "initiatedAt");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

