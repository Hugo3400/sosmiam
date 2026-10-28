import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_COMPTE_LIMITE_ANGLAIS } from "~/contenus/anglais/textes-compte-limite";

export const TEXTES_COMPTE_LIMITE = {
  lePourquoi: "Le pourquoi est dans Paramètres, Décisions de la modération.",
  voirPourquoiIndice: "Ouvre les décisions de la modération",
  voirPourquoi: "Voir pourquoi",
  fermer: "Fermer l'annonce",
} as const;

export const TEXTES_COMPTE_LIMITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COMPTE_LIMITE>> = { fr: TEXTES_COMPTE_LIMITE, en: TEXTES_COMPTE_LIMITE_ANGLAIS };
