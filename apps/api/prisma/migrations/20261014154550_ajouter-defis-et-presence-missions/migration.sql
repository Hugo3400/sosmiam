-- AlterTable
ALTER TABLE "missions_ambassadeurs" ADD COLUMN     "presence_verifiee_le" TIMESTAMPTZ(0),
ADD COLUMN     "type" VARCHAR(20);

-- CreateTable
CREATE TABLE "defis" (
    "id" SERIAL NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "titre" VARCHAR(60) NOT NULL,
    "texte" VARCHAR(300) NOT NULL,
    "mesure" VARCHAR(24) NOT NULL,
    "filtres" JSONB,
    "objectif" SMALLINT NOT NULL,
    "points" SMALLINT NOT NULL,
    "debut" CHAR(10) NOT NULL,
    "fin" CHAR(10),
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "ordre" SMALLINT NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defis_reussis" (
    "compte_id" INTEGER NOT NULL,
    "defi_id" INTEGER NOT NULL,
    "points" SMALLINT NOT NULL,
    "reussi_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defis_reussis_pkey" PRIMARY KEY ("compte_id","defi_id")
);

-- CreateIndex
CREATE INDEX "defis_publie_debut_idx" ON "defis"("publie", "debut");

-- CreateIndex
CREATE INDEX "defis_reussis_defi_id_idx" ON "defis_reussis"("defi_id");

-- AddForeignKey
ALTER TABLE "defis_reussis" ADD CONSTRAINT "defis_reussis_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defis_reussis" ADD CONSTRAINT "defis_reussis_defi_id_fkey" FOREIGN KEY ("defi_id") REFERENCES "defis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Défis de départ (décidé le 14 octobre 2026 : liste gérée dans le logiciel de gestion ; modifiables et dépubliables là-bas)
INSERT INTO "defis" ("emoji", "titre", "texte", "mesure", "filtres", "objectif", "points", "debut", "fin", "publie", "ordre") VALUES
  ('🚀', 'Premiers de cordée', 'Sois le tout premier à donner une rescousse à 3 lieux qui viennent d''arriver.', 'premiers-sauvetages', NULL, 3, 40, '2026-10-14', '2026-12-31', true, 1),
  ('🛟', 'La Brigade de l''automne', '9 rescousses avant la fin novembre : 3 par semaine, et le tour est joué.', 'rescousses', NULL, 9, 30, '2026-10-14', '2026-11-30', true, 2),
  ('🧭', 'Globe-croqueur', 'Fais valider ta visite dans 5 lieux différents. Ton estomac te dira merci.', 'lieux-differents', NULL, 5, 50, '2026-10-14', NULL, true, 3),
  ('🥐', 'La tournée des pâtissiers', '3 pâtisseries différentes, 3 visites validées. La balance, on verra plus tard.', 'lieux-differents', '{"typesLieu":["patisserie"]}', 3, 30, '2026-10-14', NULL, true, 4),
  ('🎳', 'Sors de ta cuisine', 'Bowling, escape game, karaoké… 2 sorties différentes validées.', 'lieux-differents', '{"typesLieu":["sortie"]}', 2, 30, '2026-10-14', NULL, true, 5),
  ('🔥', 'Pompier de service', 'Réponds à 2 SOS : une visite validée pendant qu''un lieu a des tables à remplir.', 'visites', '{"pendantSos":true}', 2, 40, '2026-10-14', NULL, true, 6),
  ('✍️', 'Plume gourmande', 'Écris 3 avis après tes visites. Les lieux adorent, les gourmands aussi.', 'avis', NULL, 3, 30, '2026-10-14', NULL, true, 7),
  ('📅', 'Fidèle au poste', 'Une visite validée par semaine, 3 semaines d''affilée.', 'semaines-d-affilee', NULL, 3, 40, '2026-10-14', NULL, true, 8);
