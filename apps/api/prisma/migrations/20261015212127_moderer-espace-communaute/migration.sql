-- AlterTable
ALTER TABLE "sorties_des_miamis" ADD COLUMN     "retiree_le" TIMESTAMPTZ(0);

-- AlterTable
ALTER TABLE "idees_communaute" ADD COLUMN     "retiree_le" TIMESTAMPTZ(0),
ADD COLUMN     "suspendue_le" TIMESTAMPTZ(0);

-- AlterTable
ALTER TABLE "commentaires_idees_communaute" ADD COLUMN     "retire_le" TIMESTAMPTZ(0),
ADD COLUMN     "suspendu_le" TIMESTAMPTZ(0);
