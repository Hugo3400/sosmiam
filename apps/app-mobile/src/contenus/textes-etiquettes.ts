import type { RefusEtiquetteLibre } from "@sos-miam/commun/types/etiquette";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { REFUS_ETIQUETTE_ANGLAIS, TEXTES_ETIQUETTES_ANGLAIS } from "~/contenus/anglais/textes-etiquettes";

export const TEXTES_ETIQUETTES = {
  voirPlus: (n: number) => (n === 1 ? "Voir l'autre" : `Voir les ${n} autres`),
  voirMoins: "Voir moins",
} as const;

export const REFUS_ETIQUETTE: Readonly<Record<RefusEtiquetteLibre, string>> = {
  vide: "Choisis une étiquette ou écris la tienne.",
  "trop-courte": "Un peu court : au moins 2 lettres.",
  "trop-longue": "24 caractères au plus : fais court et gourmand !",
  "mot-interdit": "Cette étiquette ne passe pas : garde-la sympa pour tout le monde.",
  alcool: "Pas d'étiquette sur l'alcool : on garde ça pour le comptoir.",
};

export const TEXTES_ETIQUETTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ETIQUETTES>> = { fr: TEXTES_ETIQUETTES, en: TEXTES_ETIQUETTES_ANGLAIS };
export const REFUS_ETIQUETTE_PAR_LANGUE: ParLangue<Traduction<typeof REFUS_ETIQUETTE>> = { fr: REFUS_ETIQUETTE, en: REFUS_ETIQUETTE_ANGLAIS };
