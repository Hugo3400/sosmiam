// Contrat des décisions de la modération vues dans l'app (règlement européen sur les services numériques, art. 17 et 20),
// mêmes routes que l'API (/app/moderation) : les décisions sur tes contenus et sur tes signalements, jamais qui a signalé,
// et la contestation (une fois par décision, pendant 6 mois). Un compte suffit, même sans pseudo.

import type { DecisionModerationApi } from "../types/signalement.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceModerationApp {
  /** GET /app/moderation/mes-decisions : 50 au plus, les plus récentes d'abord */
  listerDecisions(): Promise<ReponseApi<{ decisions: DecisionModerationApi[] }>>;
  /**
   * POST /app/moderation/:id/contestation { texte } (10 à 1 000 caractères, sans filtre de mots : on peut citer ce qu'on
   * conteste). Refus : decision-inconnue, deja-contestee, contestation-hors-delai (plus de 6 mois après la décision)
   */
  contester(signalementId: string, texte: string): Promise<ReponseApi>;
}
