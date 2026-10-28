import type { RefusEtiquetteLibre } from "@sos-miam/commun/types/etiquette";

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
