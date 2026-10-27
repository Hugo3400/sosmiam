import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_LOCALISATION_ANGLAIS } from "~/contenus/anglais/localisation";

export const TEXTES_LOCALISATION = {
  erreurs: {
    refus: "Pas de souci : tape simplement ta ville ou ta région.",
    indisponible: "On n'a pas trouvé ta position. Tape ta ville ou ta région.",
    "hors-de-france": "Tu sembles être hors de France : tape ta ville ou ta région.",
    "trop-de-demandes": "Trop d'essais d'affilée : réessaie dans quelques minutes, ou tape ta ville.",
    erreur: "La recherche de ta commune n'a pas marché. Tape ta ville ou ta région.",
  },
  recherche: "Recherche de ta position…",
  trouvee: (lieu: string) => `Trouvé : ${lieu}. Tu peux le changer si besoin.`,
};

export const TEXTES_LOCALISATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LOCALISATION>> = {
  fr: TEXTES_LOCALISATION,
  en: TEXTES_LOCALISATION_ANGLAIS,
};
