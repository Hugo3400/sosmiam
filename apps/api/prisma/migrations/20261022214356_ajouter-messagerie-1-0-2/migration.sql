-- AlterTable
ALTER TABLE "appareils_push" ADD COLUMN     "cle_apercu_chiffree" VARCHAR(200);

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "photo" VARCHAR(80);

-- AlterTable
ALTER TABLE "membres_conversations" ADD COLUMN     "epinglee_le" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "messages_conversations" ADD COLUMN     "album" VARCHAR(36),
ADD COLUMN     "modifie_le" TIMESTAMPTZ(0),
ADD COLUMN     "onde" VARCHAR(64),
ADD COLUMN     "reponse_a_id" INTEGER,
ADD COLUMN     "systeme" VARCHAR(16);

-- AlterTable
ALTER TABLE "profils_sociaux" ADD COLUMN     "accuses_lecture" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "apercu_messages" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "sorties" ADD COLUMN     "rappel_envoye_le" TIMESTAMPTZ(0);

-- CreateTable
CREATE TABLE "sondages_messages" (
    "message_id" INTEGER NOT NULL,
    "fin_le" TIMESTAMPTZ(0) NOT NULL,
    "clos_le" TIMESTAMPTZ(0),
    "gagnant" SMALLINT,

    CONSTRAINT "sondages_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "options_sondages" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "ordre" SMALLINT NOT NULL,
    "lieu_chiffre" VARCHAR(256) NOT NULL,

    CONSTRAINT "options_sondages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes_sondages" (
    "message_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,
    "vote_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_sondages_pkey" PRIMARY KEY ("message_id","compte_id")
);

-- CreateIndex
CREATE INDEX "sondages_messages_clos_le_fin_le_idx" ON "sondages_messages"("clos_le", "fin_le");

-- CreateIndex
CREATE UNIQUE INDEX "options_sondages_message_id_ordre_key" ON "options_sondages"("message_id", "ordre");

-- CreateIndex
CREATE INDEX "votes_sondages_compte_id_idx" ON "votes_sondages"("compte_id");

-- CreateIndex
CREATE INDEX "votes_sondages_option_id_idx" ON "votes_sondages"("option_id");

-- CreateIndex
CREATE INDEX "messages_conversations_conversation_id_album_idx" ON "messages_conversations"("conversation_id", "album");

-- CreateIndex
CREATE INDEX "messages_conversations_reponse_a_id_idx" ON "messages_conversations"("reponse_a_id");

-- AddForeignKey
ALTER TABLE "messages_conversations" ADD CONSTRAINT "messages_conversations_reponse_a_id_fkey" FOREIGN KEY ("reponse_a_id") REFERENCES "messages_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sondages_messages" ADD CONSTRAINT "sondages_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options_sondages" ADD CONSTRAINT "options_sondages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "sondages_messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_sondages" ADD CONSTRAINT "votes_sondages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "sondages_messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_sondages" ADD CONSTRAINT "votes_sondages_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_sondages" ADD CONSTRAINT "votes_sondages_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options_sondages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
