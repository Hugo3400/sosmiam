ALTER TABLE "appareils_push" ADD COLUMN     "offres_acceptees" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offres_acceptees_le" TIMESTAMPTZ(0);
