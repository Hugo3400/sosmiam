// Contrat des signalements des contenus sociaux (commentaire, message, liste, profil, sortie, groupe), mêmes routes que
// l'API (/app/signalements). Un compte suffit, même sans pseudo. Une publication garde POST /signalements (sans compte).
// « signalement-invalide » est un refus définitif (raison, précision ou explication) : ne pas le renvoyer tel quel.

import type { CibleSignalementSocial, SignalementContenu } from "../types/signalement.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Ce que l'app envoie : « recommandation » (la démo) n'existe pas pour l'API, un lieu envoyé est un message */
export type SignalementSocialEnvoye = Omit<SignalementContenu, "date" | "cible"> & { cible: CibleSignalementSocial };

/** Ce qui se cache pour toi, partout, une fois signalé */
export type CibleSignaleePourMoi = "commentaire" | "message" | "liste";

export interface ServiceSignalementsSociaux {
  /**
   * POST /app/signalements : 201 { masquePourTous } (un commentaire, un message ou une liste « choquant » est masqué pour
   * tout le monde en attendant la modération, sous conditions), ou 200 { deja: true } si tu l'avais déjà signalé
   */
  signaler(s: SignalementSocialEnvoye): Promise<ReponseApi<{ masquePourTous?: boolean; deja?: boolean }>>;
  /** GET /app/signalements/miens?cible= : ce que tu as signalé (500 au plus, les plus récents d'abord), caché pour toi */
  listerMiens(cible: CibleSignaleePourMoi): Promise<ReponseApi<{ cibleIds: string[] }>>;
}
