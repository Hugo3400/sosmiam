import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_ANGLAIS } from "~/contenus/anglais/textes-alertes-miam-safe-comptoir";

export const MARQUE_ALERTE_MIAM_SAFE_COMPTOIR = "🛡️ MIAM SAFE";

export const CONSIGNE_ALERTE_MIAM_SAFE_COMPTOIR = "Va discrètement à sa rencontre. Pas d'annonce en salle.";

export const TEXTES_ALERTES_MIAM_SAFE_COMPTOIR = {
  quelquUnYVa: "quelqu'un y va",
  sansReponse: "sans réponse depuis 2 min",
  besoinAide: (prenom: string) => `${prenom} a besoin d'aide`,
  onArrive: "On arrive",
  onArriveIndice: (prenom: string) => `${prenom} voit tout de suite que quelqu'un arrive`,
  annonceOnArrive: (prenom: string) => `🛡️ ${prenom} sait que tu arrives`,
};

export const TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ALERTES_MIAM_SAFE_COMPTOIR>> = {
  fr: TEXTES_ALERTES_MIAM_SAFE_COMPTOIR,
  en: TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_ANGLAIS,
};
