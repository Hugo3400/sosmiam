-- AlterTable
ALTER TABLE "demandes_connexion_qr" ADD COLUMN     "nombre_remises" SMALLINT,
ADD COLUMN     "remis_le" TIMESTAMPTZ(3),
ADD COLUMN     "session_id" INTEGER;

-- CreateIndex
CREATE INDEX "demandes_connexion_qr_session_id_idx" ON "demandes_connexion_qr"("session_id");

-- AddForeignKey
ALTER TABLE "demandes_connexion_qr" ADD CONSTRAINT "demandes_connexion_qr_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
