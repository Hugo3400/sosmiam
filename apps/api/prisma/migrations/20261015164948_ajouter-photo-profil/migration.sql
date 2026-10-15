-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "photo_profil" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_photo_profil_key" ON "comptes"("photo_profil");
