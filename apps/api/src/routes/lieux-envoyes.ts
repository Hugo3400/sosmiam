import { Router } from "express";

import { creerControleursLieuxEnvoyes } from "../controleurs/lieux-envoyes.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Envois de lieux (« Envoyer à un pote »), par compte */
export const LIMITE_LIEUX_ENVOYES = { fenetre: 24 * 60 * 60_000, maximum: 50 };

/**
 * /app/lieux-envoyes : « Envoyer à un pote ». Un lieu envoyé est un message « lieu » (le lieu et le petit mot chiffrés
 * ensemble) dans votre discussion privée, créée au besoin : mêmes règles que les messages (signalement, un an, notification).
 * Session obligatoire, jamais en cache, 🔐 (sauf « vus ») ; lectures : lireProfilSocial ; envoi et « vus » :
 * exigerProfilSocial (409 pseudo-requis). Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes
 * (Retry-After) ; 400 champ-invalide { champ }.
 *
 * POST   /app/lieux-envoyes { idClient: string (UUID v4), lieuId: number, a: string[] (1 à 20 identifiants publics), mot?: string
 *          | null } → 201 { ok, envoyes: LieuEnvoyeApi[], ignores: string[] } : un message « lieu » par pote, chacun avec ce même
 *          idClient ; ignorés : inconnus, hors de ta bande, bloqués (dans un sens ou dans l'autre) | 200 (même idClient : les
 *          messages déjà écrits, sans nouvelle notification) · 400 champ-invalide { champ: "idClient" | "lieuId" | "a" | "mot" }
 *          · 400 message-refuse { champ: "mot" } (140 caractères) · 404 lieu-inconnu (pas publié) · 409 pas-dans-la-bande (aucun
 *          destinataire valable) · 429 (50 par 24 h)
 * GET    /app/lieux-envoyes/recus[?apres=] → 200 { ok, lieux: LieuEnvoyeApi[], suite } : 30 par page, les plus récents d'abord ;
 *          sans ceux retirés de ta vue (PUT /app/masques/lieu-recu/:messageId), ni ceux de personnes bloquées, ni d'avant ton
 *          « Effacer la discussion pour moi » ; vu : jusqu'à ton dernier « vus »
 * GET    /app/lieux-envoyes/envoyes[?apres=] → idem, les tiens (vu vaut toujours vrai : jamais d'accusé de lecture)
 * PUT    /app/lieux-envoyes/vus { jusqua: string (id d'un message) } → 200 { ok } : ne recule jamais, ramené au dernier lieu reçu
 *          visible pour toi · 400 champ-invalide { champ: "jusqua" }
 */
export function creerRoutesLieuxEnvoyes(d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursLieuxEnvoyes(d, contexte);
  const { lectures, gestes } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const cle = exigerChiffrementSocial(d.chiffrement);

  const routes = Router();
  routes.post("/", contexte.parCompte(LIMITE_LIEUX_ENVOYES), exigerProfilSocial, cle, c.envoyer);
  routes.get("/recus", lectures, lireProfilSocial, cle, c.lister("recus"));
  routes.get("/envoyes", lectures, lireProfilSocial, cle, c.lister("envoyes"));
  routes.put("/vus", gestes, exigerProfilSocial, c.marquerVus);
  return routes;
}
