import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { REFUS_ETIQUETTE, TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";

export const TEXTES_ETIQUETTES_ANGLAIS: Traduction<typeof TEXTES_ETIQUETTES> = {
  voirPlus: (n: number) => (n === 1 ? "See the other one" : `See the other ${n}`),
  voirMoins: "See less",
};

export const REFUS_ETIQUETTE_ANGLAIS: Traduction<typeof REFUS_ETIQUETTE> = {
  vide: "Pick a tag or write your own.",
  "trop-courte": "A bit short – at least 2 letters.",
  "trop-longue": "24 characters max – keep it short and tasty!",
  "mot-interdit": "This tag doesn't go down well here. Keep it friendly for everyone.",
  alcool: "No tags about alcohol – we'll leave that to the bar staff.",
};
