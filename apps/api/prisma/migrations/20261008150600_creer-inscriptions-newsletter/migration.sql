-- CreateTable
CREATE TABLE "inscriptions_newsletter" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "ville" VARCHAR(80),
    "ambassadeur" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(40) NOT NULL,
    "premiere_inscription" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_inscription" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscriptions_newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_newsletter_email_key" ON "inscriptions_newsletter"("email");
