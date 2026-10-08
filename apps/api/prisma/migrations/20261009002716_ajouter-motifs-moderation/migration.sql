-- AlterTable
ALTER TABLE "signalements" ADD COLUMN     "contestation" VARCHAR(1000),
ADD COLUMN     "conteste_le" TIMESTAMPTZ(0),
ADD COLUMN     "motif" VARCHAR(20),
ADD COLUMN     "motivation" VARCHAR(1000),
ADD COLUMN     "reexamine_le" TIMESTAMPTZ(0);
