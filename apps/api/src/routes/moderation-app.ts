import { Router } from "express";

import { creerControleursModerationApp } from "../controleurs/moderation-app.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Contestations, par compte */
export const LIMITE_CONTESTATIONS = { fenetre: 24 * 60 * 60_000, maximum: 5 };

/**
 * /app/moderation : les décisions de la modération qui te concernent (règlement européen sur les services numériques, art.
 * 17 et 20 ; CGU du 8 octobre 2026). Session obligatoire, jamais en cache, lireProfilSocial (un compte suffit, même sans
 * pseudo). Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ; 400
 * champ-invalide { champ }.
 *
 * GET    /app/moderation/mes-decisions → 200 { ok, decisions: DecisionModerationApi[] } (50 au plus, les plus récentes
 *          d'abord) : les signalements sur TES contenus qui les ont masqués en attendant (statut « masque ») ou qui ont été
 *          jugés (une ligne par contenu : la modération décide ensemble les signalements d'un même contenu), et TES
 *          signalements jugés. Pour chacun : cible (le type seulement), ton rôle (« auteur » ou « signale »), statut, motif,
 *          motivation, date de la décision, contestableJusqua (décision + 6 mois, quand ton rôle peut la contester), état de
 *          la contestation. Jamais qui a signalé, jamais son explication
 * POST   /app/moderation/:id/contestation { texte } → 200 { ok } : 10 à 1 000 caractères (sans filtre de mots : on peut
 *          citer ce qu'on conteste) ; l'auteur du contenu conteste la dernière décision « retenu » sur son contenu, celui qui
 *          a signalé conteste le rejet de SON signalement ; une fois par décision, dans les 6 mois. Le logiciel de gestion
 *          réexamine (contesterSignalement) · 404 decision-inconnue (pas la tienne, ou pas encore jugée) · 409
 *          deja-contestee | contestation-hors-delai · 400 champ-invalide { champ: "id" | "texte" } · 429 : 5 par 24 h
 */
export function creerRoutesModerationApp(d: Pick<DependancesSocialApp, "decisions">, contexte: ContexteRoutesSociales) {
  const c = creerControleursModerationApp(d, contexte.horloge);
  const { lireProfilSocial } = contexte.profils;
  const routes = Router();
  routes.get("/mes-decisions", contexte.lectures, lireProfilSocial, c.listerDecisions);
  routes.post("/:id/contestation", contexte.parCompte(LIMITE_CONTESTATIONS), lireProfilSocial, c.contester);
  return routes;
}
