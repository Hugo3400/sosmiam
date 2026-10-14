-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(6) NOT NULL,
    "cle_prive" VARCHAR(24),
    "titre_chiffre" VARCHAR(512),
    "emoji" VARCHAR(16),
    "cree_par_id" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "dernier_message_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres_conversations" (
    "conversation_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "role" VARCHAR(6) NOT NULL DEFAULT 'membre',
    "visible_apres" INTEGER NOT NULL DEFAULT 0,
    "lu_jusqua" INTEGER NOT NULL DEFAULT 0,
    "coupee" BOOLEAN NOT NULL DEFAULT false,
    "arrive_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_conversations_pkey" PRIMARY KEY ("conversation_id","compte_id")
);

-- CreateTable
CREATE TABLE "messages_conversations" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "auteur_id" INTEGER,
    "type" VARCHAR(6) NOT NULL,
    "id_client" VARCHAR(36) NOT NULL,
    "texte_chiffre" VARCHAR(2200),
    "fichier" VARCHAR(80),
    "type_mime" VARCHAR(16),
    "taille" INTEGER,
    "largeur" SMALLINT,
    "hauteur" SMALLINT,
    "duree_secondes" SMALLINT,
    "media_expire_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprime_le" TIMESTAMPTZ(0),
    "suspendu_le" TIMESTAMPTZ(0),
    "retire_le" TIMESTAMPTZ(0),

    CONSTRAINT "messages_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departs_groupes" (
    "conversation_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "parti_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departs_groupes_pkey" PRIMARY KEY ("conversation_id","compte_id")
);

-- CreateTable
CREATE TABLE "reactions_messages" (
    "message_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "reaction" VARCHAR(8) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_messages_pkey" PRIMARY KEY ("message_id","compte_id","reaction")
);

-- CreateTable
CREATE TABLE "invitations_groupes" (
    "conversation_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "invite_par_id" INTEGER,
    "statut" VARCHAR(8) NOT NULL DEFAULT 'invite',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),

    CONSTRAINT "invitations_groupes_pkey" PRIMARY KEY ("conversation_id","compte_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_cle_prive_key" ON "conversations"("cle_prive");

-- CreateIndex
CREATE INDEX "conversations_dernier_message_le_idx" ON "conversations"("dernier_message_le");

-- CreateIndex
CREATE INDEX "conversations_cree_par_id_idx" ON "conversations"("cree_par_id");

-- CreateIndex
CREATE INDEX "membres_conversations_compte_id_idx" ON "membres_conversations"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversations_fichier_key" ON "messages_conversations"("fichier");

-- CreateIndex
CREATE INDEX "messages_conversations_conversation_id_id_idx" ON "messages_conversations"("conversation_id", "id");

-- CreateIndex
CREATE INDEX "messages_conversations_auteur_id_cree_le_idx" ON "messages_conversations"("auteur_id", "cree_le");

-- CreateIndex
CREATE INDEX "messages_conversations_media_expire_le_idx" ON "messages_conversations"("media_expire_le");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversations_conversation_id_id_client_key" ON "messages_conversations"("conversation_id", "id_client");

-- CreateIndex
CREATE INDEX "departs_groupes_compte_id_idx" ON "departs_groupes"("compte_id");

-- CreateIndex
CREATE INDEX "departs_groupes_parti_le_idx" ON "departs_groupes"("parti_le");

-- CreateIndex
CREATE INDEX "reactions_messages_compte_id_idx" ON "reactions_messages"("compte_id");

-- CreateIndex
CREATE INDEX "invitations_groupes_compte_id_statut_idx" ON "invitations_groupes"("compte_id", "statut");

-- CreateIndex
CREATE INDEX "invitations_groupes_invite_par_id_idx" ON "invitations_groupes"("invite_par_id");

-- CreateIndex
CREATE INDEX "invitations_groupes_cree_le_idx" ON "invitations_groupes"("cree_le");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_cree_par_id_fkey" FOREIGN KEY ("cree_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conversations" ADD CONSTRAINT "membres_conversations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conversations" ADD CONSTRAINT "membres_conversations_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_conversations" ADD CONSTRAINT "messages_conversations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_conversations" ADD CONSTRAINT "messages_conversations_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departs_groupes" ADD CONSTRAINT "departs_groupes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departs_groupes" ADD CONSTRAINT "departs_groupes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions_messages" ADD CONSTRAINT "reactions_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions_messages" ADD CONSTRAINT "reactions_messages_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_groupes" ADD CONSTRAINT "invitations_groupes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_groupes" ADD CONSTRAINT "invitations_groupes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_groupes" ADD CONSTRAINT "invitations_groupes_invite_par_id_fkey" FOREIGN KEY ("invite_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
