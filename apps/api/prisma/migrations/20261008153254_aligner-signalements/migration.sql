-- AlterTable
ALTER TABLE "signalements" DROP COLUMN "detail",
DROP COLUMN "motif",
ADD COLUMN     "explication" VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN     "lieu_id" INTEGER,
ADD COLUMN     "precision" VARCHAR(80),
ADD COLUMN     "raison" VARCHAR(12) NOT NULL;
