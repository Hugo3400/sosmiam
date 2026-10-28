import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_DONNEES_STRUCTUREES_ANGLAIS } from "~/contenus/anglais/donnees-structurees";

export const TEXTES_DONNEES_STRUCTUREES = {
  langue: "fr-FR",
  descriptionOrganisation:
    "SOS Miam, l'app et le site pour trouver les restos, bars, pâtisseries et sorties indépendants de ton quartier, et donner un coup de main aux lieux en SOS.",
};

export const TEXTES_DONNEES_STRUCTUREES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DONNEES_STRUCTUREES>> = {
  fr: TEXTES_DONNEES_STRUCTUREES,
  en: TEXTES_DONNEES_STRUCTUREES_ANGLAIS,
};
