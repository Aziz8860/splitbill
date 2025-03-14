-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'Cash';
