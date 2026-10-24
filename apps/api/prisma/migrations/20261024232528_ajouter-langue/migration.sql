-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "langue" VARCHAR(5) NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "inscriptions_newsletter" ADD COLUMN     "langue" VARCHAR(5) NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "confirmations_newsletter" ADD COLUMN     "langue" VARCHAR(5) NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "appareils_push" ADD COLUMN     "langue" VARCHAR(5) NOT NULL DEFAULT 'fr';
