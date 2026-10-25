-- AlterTable
ALTER TABLE "lieux" ADD COLUMN     "banniere" VARCHAR(64),
ADD COLUMN     "images_maj_le" TIMESTAMPTZ(0),
ADD COLUMN     "logo" VARCHAR(64);
