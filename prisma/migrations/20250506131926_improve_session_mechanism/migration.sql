-- DropIndex
DROP INDEX "UserSession_userId_key";

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "expired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WalletActivity" (
    "signature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletActivity_pkey" PRIMARY KEY ("signature")
);

-- AddForeignKey
ALTER TABLE "WalletActivity" ADD CONSTRAINT "WalletActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
