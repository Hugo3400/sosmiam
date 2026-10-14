import { Router } from "express";

import { creerControleursSignalementsSociaux } from "../controleurs/signalements-sociaux.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Signalements de contenus sociaux, par compte */
export const LIMITE_SIGNALEMENTS_SOCIAUX = { fenetre: 24 * 60 * 60_000, maximum: 20 };

/**
 * /app/signalements : signaler un contenu social (règlement européen sur les services numériques). Session obligatoire,
 * jamais en cache, lireProfilSocial (un compte suffit pour signaler, même sans pseudo ; rien n'est créé). Une publication
 * garde POST /signalements, sans compte. Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes
 * (Retry-After) ; 400 champ-invalide { champ } ; 503 chiffrement-indisponible (🔐 : l'instantané est chiffré).
 *
 * POST   /app/signalements (🔐) { cible, cibleId, raison, precision, explication }
 *          → 201 { ok, masquePourTous: boolean } : un commentaire, un message ou une liste disparaît pour toi, partout (lu
 *            depuis le signalement, jamais par les masques) ; un profil, une sortie ou un groupe restent visibles. Raison
 *            « choquant » sur un commentaire, un message ou une liste : masqué pour tout le monde en attendant la modération,
 *            SEULEMENT si tu as un e-mail vérifié, un compte de 7 jours au moins, et si ce texte n'a jamais eu de signalement
 *            rejeté ; sinon le signalement passe en tête de file sans rien masquer. Masqué : son auteur reçoit tout de suite
 *            « contenu-masque » dans sa cloche (detail « choquant », sans dire qui a signalé)
 *          → 200 { ok, deja: true } : tu l'avais déjà signalé (rien de plus)
 *          - cible : commentaire | message | liste | profil | sortie | groupe ; cibleId : l'identifiant du contenu, ou
 *            l'identifiant public de la personne pour un profil ;
 *          - raison : RAISONS_SIGNALEMENT ; precision : 80 caractères ou null ; explication : 500 caractères, 10 au moins
 *            pour « autre » (validerSignalementContenu de commun) ;
 *          - il faut pouvoir VOIR le contenu (message : membre de la discussion, arrivé avant lui, sans blocage avec son
 *            auteur ; liste visible pour toi ; commentaire visible ; profil sans blocage ; sortie dont tu es participant ou
 *            invité ; groupe dont tu es membre), et ne pas en être l'auteur.
 *          · 400 signalement-invalide (refus définitif : ne pas renvoyer tel quel) · 404 contenu-inconnu · 429 : 20 par 24 h
 * GET    /app/signalements/miens?cible=<commentaire|message|liste> → 200 { ok, cibleIds: string[] } (500 au plus, les plus
 *          récents d'abord) : ce que tu as signalé, à cacher pour toi · 400 champ-invalide { champ: "cible" }
 *
 * Enregistré dans une seule transaction : { cible, cibleId, signaleParId, auteurContenuId, lieuId (commentaire : celui de
 * la publication), raison, precision, explication, source: "app" }, puis, avec son id, l'instantané chiffré et, pour une
 * photo ou une note vocale, son fichier (gardé sur le disque tant que le signalement n'est pas jugé). Ce qu'on a signalé
 * reste caché pour soi tant que le signalement existe (1 an après la décision).
 */
export function creerRoutesSignalementsSociaux(d: Pick<DependancesSocialApp, "signalements" | "chiffrement">, contexte: ContexteRoutesSociales) {
  const c = creerControleursSignalementsSociaux(d, contexte.horloge, contexte.appliquer);
  const { lireProfilSocial } = contexte.profils;
  const routes = Router();
  routes.post("/", exigerChiffrementSocial(d.chiffrement), contexte.parCompte(LIMITE_SIGNALEMENTS_SOCIAUX), lireProfilSocial, c.signaler);
  routes.get("/miens", contexte.lectures, lireProfilSocial, c.listerMiens);
  return routes;
}
