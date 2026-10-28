import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ALERTES_MIAM_SAFE_COMPTOIR } from "~/contenus/textes-alertes-miam-safe-comptoir";

export const TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_ALERTES_MIAM_SAFE_COMPTOIR> = {
  quelquUnYVa: "someone's on their way",
  sansReponse: "no reply for 2 min",
  besoinAide: (prenom: string) => `${prenom} needs help`,
  onArrive: "On our way",
  onArriveIndice: (prenom: string) => `${prenom} will see straight away that someone's coming`,
  annonceOnArrive: (prenom: string) => `🛡️ ${prenom} knows you're on your way`,
};
