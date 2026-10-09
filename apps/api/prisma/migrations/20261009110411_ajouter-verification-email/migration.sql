-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "email_verifie_le" TIMESTAMPTZ(0),
ADD COLUMN     "jeton_verification" VARCHAR(64),
ADD COLUMN     "jeton_verification_expire_le" TIMESTAMPTZ(0);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_jeton_verification_key" ON "comptes"("jeton_verification");
