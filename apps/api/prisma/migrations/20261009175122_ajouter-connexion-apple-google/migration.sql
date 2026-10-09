-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "apple_sub" VARCHAR(255),
ADD COLUMN     "google_sub" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_apple_sub_key" ON "comptes"("apple_sub");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_google_sub_key" ON "comptes"("google_sub");
