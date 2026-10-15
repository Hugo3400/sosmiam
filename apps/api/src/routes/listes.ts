import { Router } from "express";

import { creerControleursListes } from "../controleurs/listes.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Créations de listes, par compte (en plus des 50 listes comptées en base) */
export const LIMITE_CREATIONS_LISTES = { fenetre: 24 * 60 * 60_000, maximum: 20 };

/**
 * /app/listes : session obligatoire (Authorization: Bearer), jamais en cache ; lectures : lireProfilSocial (rien n'est
 * créé) ; écritures : exigerProfilSocial (409 pseudo-requis). Une liste se voit si (peutVoirListe) : tu en es l'auteur ou
 * un co-auteur accepté ; ou « bande » et tu es dans la bande de l'auteur ; ou « tous » et ton niveau sur l'auteur est
 * « public » ou « bande ». Jamais une liste suspendue ou retirée par la modération (sauf pour son auteur, qui la voit « en
 * attente de la modération » : enModeration), ni une liste que tu as signalée, ni la liste de quelqu'un avec qui il y a un
 * blocage, dans un sens ou dans l'autre. Règle « 404 avant 403 » : une liste que tu ne vois pas répond toujours 404
 * liste-inconnue, même aux gestes réservés à l'auteur. Seuls les lieux encore publiés sont montrés et comptés. Erreurs
 * { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ; 400 champ-invalide { champ } ;
 * 409 pseudo-requis. Compte limité par l'équipe (refuserSiLimite, avant le profil social) : 403 compte-limite { details:
 * { jusqua } } sur POST (créer), PATCH /:id, PUT /:id/lieux/:lieuId et POST /:id/co-auteurs ; le reste passe (supprimer,
 * retirer un lieu, accepter ou refuser une invitation, suivre une liste…).
 *
 * GET    /app/listes               → 200 { ok, miennes: ListeResumeApi[], coEcrites: ListeResumeApi[], suivies: ListeResumeApi[],
 *          invitations: ListeResumeApi[] } (invitations : co-auteur, à accepter)
 * GET    /app/listes/a-decouvrir[?apres=] → 200 { ok, listes: ListeResumeApi[], suite } : listes visibles de ta bande et des
 *          personnes que tu suis (abonnement accepté), pas les tiennes ni celles que tu remplis, sans celles retirées de ta
 *          vue ; 20 par page, plus récemment modifiées d'abord · 400 champ-invalide { champ: "apres" }
 * GET    /app/listes/:id           → 200 { ok, liste: ListeApi } · 404 liste-inconnue (absente, retirée ou pas visible)
 * POST   /app/listes { titre, emoji, description?: string, visibilite: "tous" | "bande" } (en-tête Idempotency-Key) → 201 { ok,
 *          liste } | 200 { ok, liste } (même clé : déjà créée)
 *          · 400 champ-invalide | message-refuse { champ: "titre" | "emoji" | "description" | "visibilite" | "idClient" }
 *          (titre 1 à 40, description 140, un emoji de 16 caractères au plus) · 409 trop-de-listes (50) · 429 (20 par 24 h)
 * PATCH  /app/listes/:id { titre?, emoji?, description?, visibilite? } → 200 { ok, liste } · 404 liste-inconnue · 403
 *          reserve-a-l-auteur · 400 champ-invalide | message-refuse { champ }
 * DELETE /app/listes/:id           → 200 { ok } · 404 liste-inconnue · 403 reserve-a-l-auteur (un signalement en cours garde
 *          son instantané : la preuve reste)
 * PUT    /app/listes/:id/lieux/:lieuId    → 200 { ok, liste } : auteur ou co-auteur accepté · 404 liste-inconnue | lieu-inconnu
 *          (pas publié) · 403 reserve-a-l-auteur · 409 liste-pleine (100 lieux)
 * DELETE /app/listes/:id/lieux/:lieuId    → 200 { ok, liste } : l'auteur retire n'importe quel lieu, un co-auteur seulement
 *          ceux qu'il a ajoutés · 404 liste-inconnue · 403 reserve-a-l-auteur
 * POST   /app/listes/:id/co-auteurs { personne } → 201 { ok, liste } : invite un pote de TA bande (« liste-coauteur » dans sa
 *          cloche). Une personne déjà là, ou qui a refusé il y a moins de 30 jours, n'est pas réinvitée (la réponse est la
 *          même, rien ne part) · 404 liste-inconnue | personne-inconnue · 403 reserve-a-l-auteur · 409 pas-dans-la-bande |
 *          trop-de-co-auteurs (10, invitations en attente comprises) · 400 champ-invalide { champ: "personne" } (toi-même)
 * POST   /app/listes/:id/co-auteurs/moi/accepter → 200 { ok, liste } · 404 invitation-inconnue
 * DELETE /app/listes/:id/co-auteurs/:personne → 200 { ok } : l'auteur retire un co-auteur (ou une invitation en attente) ;
 *          « moi » à la place d'un identifiant : refuser l'invitation (statut « refuse », sans prévenir) ou ne plus remplir la
 *          liste · 404 liste-inconnue | personne-inconnue · 403 reserve-a-l-auteur
 * PUT    /app/listes/:id/abonnement    → 200 { ok, liste } : suivre la liste · 404 liste-inconnue · 400 champ-invalide (la
 *          sienne)
 * DELETE /app/listes/:id/abonnement    → 200 { ok, liste }
 */
export function creerRoutesListes(d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursListes(d, contexte);
  const { lectures, gestes, refuserSiLimite } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const routes = Router();
  routes.get("/", lectures, lireProfilSocial, c.listerMiennes);
  routes.get("/a-decouvrir", lectures, lireProfilSocial, c.listerADecouvrir);
  routes.post("/", contexte.parCompte(LIMITE_CREATIONS_LISTES), refuserSiLimite, exigerProfilSocial, c.creer);
  routes.get("/:id", lectures, lireProfilSocial, c.lire);
  routes.patch("/:id", gestes, refuserSiLimite, exigerProfilSocial, c.modifier);
  routes.delete("/:id", gestes, exigerProfilSocial, c.supprimer);
  routes.put("/:id/lieux/:lieuId", gestes, refuserSiLimite, exigerProfilSocial, c.basculerLieu(true));
  routes.delete("/:id/lieux/:lieuId", gestes, exigerProfilSocial, c.basculerLieu(false));
  routes.post("/:id/co-auteurs", gestes, refuserSiLimite, exigerProfilSocial, c.inviterCoAuteur);
  routes.post("/:id/co-auteurs/moi/accepter", gestes, exigerProfilSocial, c.accepterCoAuteur);
  routes.delete("/:id/co-auteurs/:personne", gestes, exigerProfilSocial, c.retirerCoAuteur);
  routes.put("/:id/abonnement", gestes, exigerProfilSocial, c.suivre(true));
  routes.delete("/:id/abonnement", gestes, exigerProfilSocial, c.suivre(false));
  return routes;
}
