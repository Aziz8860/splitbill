-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "participants" JSONB,
ADD COLUMN     "splitMethod" TEXT DEFAULT 'evenly',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN;

-- CreateTable
CREATE TABLE "ReceiptPerson" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "ReceiptPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptPerson_receiptId_personId_key" ON "ReceiptPerson"("receiptId", "personId");

-- AddForeignKey
ALTER TABLE "ReceiptPerson" ADD CONSTRAINT "ReceiptPerson_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptPerson" ADD CONSTRAINT "ReceiptPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
