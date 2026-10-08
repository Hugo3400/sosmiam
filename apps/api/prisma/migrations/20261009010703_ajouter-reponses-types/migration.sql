-- CreateTable
CREATE TABLE "reponses_types" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(80) NOT NULL,
    "categorie" VARCHAR(20) NOT NULL DEFAULT 'autre',
    "objet" VARCHAR(150) NOT NULL DEFAULT '',
    "texte" VARCHAR(5000) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reponses_types_pkey" PRIMARY KEY ("id")
);
