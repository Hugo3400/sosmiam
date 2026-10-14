import { Router } from "express";

import { creerControleursSorties } from "../controleurs/sorties.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Créations de sorties, par compte (en plus des 20 sorties à venir comptées en base) */
export const LIMITE_CREATIONS_SORTIES = { fenetre: 24 * 60 * 60_000, maximum: 10 };

/**
 * /app/sorties : session obligatoire (Authorization: Bearer), jamais en cache ; lectures : lireProfilSocial (rien n'est
 * créé) ; écritures : exigerProfilSocial (409 pseudo-requis). Participants : les invitations « accepte » (organisateur
 * compris). Seuls eux voient les propositions, les votes et la discussion, et peuvent proposer et voter. Un invité qui n'a
 * pas encore répondu voit seulement l'invitation. Règle « 404 avant 403 » : une sortie dont tu n'es ni participant ni
 * invité répond 404 sortie-inconnue, même aux gestes de l'organisateur. Votes : ceux d'une personne avec qui il y a un
 * blocage (dans un sens ou dans l'autre) ne sont pas nommés, mais comptent dans nombreVotes ; seuls ceux des participants
 * comptent. Une invitation d'une personne avec qui il y a un blocage (l'organisateur qui a la main, ou celui qui a invité)
 * n'existe plus pour l'invité : cachée, et 404 sortie-inconnue s'il l'accepte. Erreurs { ok: false, erreur,
 * champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ; 400 champ-invalide { champ } ; 409 pseudo-requis.
 *
 * GET    /app/sorties              → 200 { ok, sorties: SortieApi[], invitations: InvitationSortieApi[] } : tes sorties (à venir
 *          d'abord, de la plus proche à la plus lointaine, puis les passées de la plus récente à la plus ancienne ; sans celles
 *          retirées de ta vue ; 100 au plus) et les invitations à venir qui attendent ta réponse
 * GET    /app/sorties/:id[?version=<n>] → 200 { ok, sortie: SortieApi } | 200 { ok, inchange: true, version } (même version)
 *          | 200 { ok, invitation: InvitationSortieApi } (invité pas encore décidé) · 404 sortie-inconnue
 *          · 400 champ-invalide { champ: "id" | "version" }
 * POST   /app/sorties { titre, emoji, quand: ISO, finVote: ISO, invites: string[], lieux: number[] } (en-tête Idempotency-Key)
 *          → 201 { ok, sortie } | 200 { ok, sortie } (même clé : déjà créée, personne n'est prévenu deux fois)
 *          validerNouvelleSortie (commun) : titre 1 à 40 caractères, filtre de mots ; un emoji ; quand au moins 15 min plus
 *          tard, au plus 366 jours ; finVote au moins 10 min plus tard, et au plus tard à « quand » ; 1 à 14 invités de TA
 *          bande ; 1 à 8 lieux publiés, dédoublonnés. L'organisateur propose ces lieux et vote pour eux. Chaque invité reçoit
 *          « invitation-sortie » (cloche, et téléphone, hors anti-spam)
 *          · 400 champ-invalide | message-refuse { champ: "titre" | "emoji" | "quand" | "finVote" | "invites" | "lieux" |
 *            "idClient" } · 404 lieu-inconnu · 409 pas-dans-la-bande · 409 trop-de-sorties (20 à venir organisées par toi)
 *          · 429 (10 créations par 24 h)
 * POST   /app/sorties/:id/reponse { vient: boolean }
 *          → 200 { ok, sortie } (oui : tu entres dans le vote et la discussion) | 200 { ok } (non : statut « refuse », sans
 *            prévenir ; on ne peut plus t'y réinviter ; « non » après avoir dit oui : tu quittes la sortie)
 *          · 404 sortie-inconnue (pas invité, ou blocage avec l'organisateur : l'invitation est effacée) · 409 sortie-passee
 * POST   /app/sorties/:id/invites { invites: string[] } → 200 { ok, sortie } : l'organisateur invite d'autres potes de SA bande,
 *          15 personnes au plus en tout (en attente comprises, refus non comptés). Ceux qui ont refusé sont sautés, sans le
 *          dire. Le téléphone d'un réinvité (après un retrait) ne sonne pas deux fois en 24 h pour la même sortie : la cloche
 *          suffit · 404 sortie-inconnue · 403 reserve-a-l-organisateur · 409 sortie-pleine | sortie-passee | pas-dans-la-bande
 * POST   /app/sorties/:id/propositions { lieuId } → 201 { ok, sortie } (celui qui propose vote d'office) | 200 { ok, sortie, deja:
 *          true } · 404 sortie-inconnue | lieu-inconnu · 409 vote-termine | max-propositions (8)
 * PUT    /app/sorties/:id/votes/:lieuId    → 200 { ok, sortie } · 404 sortie-inconnue | lieu-inconnu (pas proposé) · 409
 *          vote-termine
 * DELETE /app/sorties/:id/votes/:lieuId    → 200 { ok, sortie } · 404 sortie-inconnue · 409 vote-termine
 * POST   /app/sorties/:id/terminer-vote    → 200 { ok, sortie } : lieu retenu tout de suite (« sortie-lieu-choisi » pour les
 *          participants) · 404 sortie-inconnue · 403 reserve-a-l-organisateur · 409 vote-termine
 * DELETE /app/sorties/:id/participants/:personne → 200 { ok } : l'organisateur retire un participant ou une invitation en
 *          attente, sans prévenir : son invitation est effacée et il sort de la discussion (l'organisateur pourra le réinviter)
 *          · 404 sortie-inconnue · 403 reserve-a-l-organisateur · 404 personne-inconnue (vérifiée en dernier : pas dans la
 *          sortie, ou inconnue ; une personne qui t'a bloqué se retire comme les autres) · 400 champ-invalide { champ: "personne" }
 * DELETE /app/sorties/:id/participation    → 200 { ok } : quitter (tu sors aussi de la discussion). L'organisateur qui part
 *          passe la main au plus ancien participant ; sans personne d'autre, la sortie est effacée (effacerConversations)
 * DELETE /app/sorties/:id          → 200 { ok } : l'organisateur annule ; la sortie et sa discussion sont effacées
 *          (effacerConversations ; un message signalé garde son instantané et son fichier) (« sortie-annulee » dans la cloche
 *          des participants et des invités) · 404 sortie-inconnue · 403 reserve-a-l-organisateur
 *
 * La discussion : /app/conversations/:conversationId, avec conversationId dans SortieApi. Ses membres ne changent QUE par
 * ces routes (réponse, invitation, retrait, départ, annulation) : la messagerie refuse d'y toucher (409 geree-par-la-sortie).
 * Le lieu retenu à finVote : taches/terminer-votes-sorties.ts, chaque minute.
 */
export function creerRoutesSorties(d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursSorties(d, contexte);
  const { lectures, gestes } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const routes = Router();
  routes.get("/", lectures, lireProfilSocial, c.lister);
  routes.post("/", contexte.parCompte(LIMITE_CREATIONS_SORTIES), exigerProfilSocial, c.creer);
  routes.get("/:id", lectures, lireProfilSocial, c.lire);
  routes.delete("/:id", gestes, exigerProfilSocial, c.annuler);
  routes.post("/:id/reponse", gestes, exigerProfilSocial, c.repondre);
  routes.post("/:id/invites", gestes, exigerProfilSocial, c.inviter);
  routes.post("/:id/propositions", gestes, exigerProfilSocial, c.proposer);
  routes.put("/:id/votes/:lieuId", gestes, exigerProfilSocial, c.voter(true));
  routes.delete("/:id/votes/:lieuId", gestes, exigerProfilSocial, c.voter(false));
  routes.post("/:id/terminer-vote", gestes, exigerProfilSocial, c.terminerVote);
  routes.delete("/:id/participants/:personne", gestes, exigerProfilSocial, c.retirerParticipant);
  routes.delete("/:id/participation", gestes, exigerProfilSocial, c.quitter);
  return routes;
}
