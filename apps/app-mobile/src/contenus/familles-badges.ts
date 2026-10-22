import type { IdBadge } from "@sos-miam/commun/types/badge";

export type FamilleDeBadges = {
  titre: string;
  badges: readonly IdBadge[];
};

export const FAMILLES_BADGES: readonly FamilleDeBadges[] = [
  {
    titre: "Rescousses",
    badges: [
      "premiere-rescousse",
      "sauveteur-en-serie",
      "second-du-capitaine",
      "heros-de-la-brigade",
      "coeur-sur-la-main",
      "bonne-etoile",
      "premier-sauveteur",
      "vigie",
    ],
  },
  {
    titre: "Découvertes",
    badges: ["deniche-par-toi", "fondateur", "fureteur", "explorateur", "baroudeur", "bande"],
  },
  {
    titre: "Restos et pâtisseries",
    badges: ["fine-fourchette", "fourchette-d-or", "tour-de-table", "iode", "bec-sucre", "creme-de-la-creme", "as-du-gouter"],
  },
  {
    titre: "Fidèle au poste",
    badges: ["habitue", "mordu-de-miam", "legende-du-miam", "serie-4", "saison-complete", "marathon-du-miam", "un-an-de-miam", "noctambule"],
  },
  {
    titre: "Avis",
    badges: ["premiere-plume", "plume-de-la-brigade", "plume-d-or", "oeil-de-chef", "objectif-gourmand"],
  },
  {
    titre: "Coup de main à la Brigade",
    badges: ["chasseur-de-bugs"],
  },
];

export const TITRE_FAMILLE_AUTRES = "Autres";
