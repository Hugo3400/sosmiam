import type { RubriqueActus } from "../regles/actus.ts";
import type { ParLangue } from "../types/traduction.ts";
import { LIBELLES_ACTUS_ANGLAIS } from "./anglais/libelles-actus.ts";

export type LibellesActus = {
  rubriques: Readonly<Record<RubriqueActus, string>>;
  filtres: Readonly<Record<RubriqueActus | "tout", string>>;
  aLaUne: string;
  ambassadeur: string;
  collaboration: string;
  collaborationGlose: string | null;
};

export const LIBELLES_ACTUS: LibellesActus = {
  rubriques: {
    portrait: "Portrait d'un lieu",
    "top-quartier": "Le top 5 du quartier",
    "bon-plan": "Bon plan du moment",
    "recit-sortie": "Récit de sortie",
  },
  filtres: { tout: "Tout", portrait: "Portraits", "top-quartier": "Tops", "bon-plan": "Bons plans", "recit-sortie": "Récits" },
  aLaUne: "À la une",
  ambassadeur: "Ambassadeur·rice",
  collaboration: "Collaboration commerciale",
  collaborationGlose: null,
};

export const LIBELLES_ACTUS_PAR_LANGUE: ParLangue<LibellesActus> = { fr: LIBELLES_ACTUS, en: LIBELLES_ACTUS_ANGLAIS };
