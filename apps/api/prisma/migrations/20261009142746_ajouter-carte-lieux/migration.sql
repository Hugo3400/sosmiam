-- AlterTable
ALTER TABLE "lieux" ADD COLUMN     "carte" JSONB,
ADD COLUMN     "carte_maj_le" TIMESTAMPTZ(0);
