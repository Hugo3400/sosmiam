-- AlterTable
ALTER TABLE "campagnes_newsletter" ADD COLUMN     "description" VARCHAR(300) NOT NULL DEFAULT '',
ADD COLUMN     "public" VARCHAR(20) NOT NULL DEFAULT 'newsletter';
