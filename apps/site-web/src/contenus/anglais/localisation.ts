import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_LOCALISATION } from "~/contenus/localisation";

export const TEXTES_LOCALISATION_ANGLAIS: Traduction<typeof TEXTES_LOCALISATION> = {
  erreurs: {
    refus: "No worries – just type your city or region.",
    indisponible: "We couldn't find your location. Type your city or region.",
    "hors-de-france": "You seem to be outside France – type your city or region.",
    "trop-de-demandes": "Too many tries in a row – try again in a few minutes, or type your city.",
    erreur: "Looking up your town didn't work. Type your city or region.",
  },
  recherche: "Finding your location…",
  trouvee: (lieu: string) => `Found: ${lieu}. You can change it if you need to.`,
};
