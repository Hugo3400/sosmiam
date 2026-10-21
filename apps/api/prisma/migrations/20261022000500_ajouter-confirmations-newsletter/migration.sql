-- CreateTable
CREATE TABLE "confirmations_newsletter" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "ville" VARCHAR(80),
    "ambassadeur" BOOLEAN NOT NULL DEFAULT false,
    "telephone" VARCHAR(10),
    "beta" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(40) NOT NULL,
    "jeton_empreinte" VARCHAR(64) NOT NULL,
    "expire_le" TIMESTAMPTZ(0) NOT NULL,
    "envoye_le" TIMESTAMPTZ(0) NOT NULL,
    "envois" INTEGER NOT NULL DEFAULT 1,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmations_newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "confirmations_newsletter_email_key" ON "confirmations_newsletter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "confirmations_newsletter_jeton_empreinte_key" ON "confirmations_newsletter"("jeton_empreinte");

-- CreateIndex
CREATE INDEX "confirmations_newsletter_expire_le_idx" ON "confirmations_newsletter"("expire_le");
