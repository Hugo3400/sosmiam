-- AlterTable
ALTER TABLE "lieux" ADD COLUMN     "accessible" BOOLEAN,
ADD COLUMN     "animaux" VARCHAR(10),
ADD COLUMN     "enfants" BOOLEAN,
ADD COLUMN     "paiements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parking" BOOLEAN,
ADD COLUMN     "reservation" VARCHAR(12),
ADD COLUMN     "terrasse" BOOLEAN,
ADD COLUMN     "wifi" BOOLEAN;
