import express, { Router, type RequestHandler } from "express";

import { creerControleursConversations } from "../controleurs/conversations.ts";
import { creerControleursMediasChat, ERREURS_MEDIAS_CHAT, TYPES_MEDIAS_CHAT } from "../controleurs/conversations-medias.ts";
import { refuserSocial } from "../controleurs/social-champs.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import { limiterEnvoisMedias } from "../middlewares/limiter-envois-medias.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Messages texte et lieu, et leurs modifications, par compte */
export const LIMITE_MESSAGES = { fenetre: 60_000, maximum: 30 };
/** Photos et notes vocales (et photo d'un groupe), par compte (en plus des quotas en base : 50 par 24 h, 1 Go gardé) */
export const LIMITE_MEDIAS = { fenetre: 10 * 60_000, maximum: 20 };
/** Créations de groupes, par compte */
export const LIMITE_CREATIONS_GROUPES = { fenetre: 24 * 60 * 60_000, maximum: 20 };
/** Le plus gros corps accepté (une photo de 5 Mo et sa marge) ; nginx laisse passer 6 Mo sur cette seule adresse */
export const TAILLE_MAX_CORPS_MEDIA = "6mb";

/**
 * /app/conversations : la messagerie entre potes (privé, groupes, discussions des sorties). Session obligatoire
 * (Authorization: Bearer), jamais en cache. Lectures : lireProfilSocial (sans profil : liste vide, 404 ailleurs) ; écritures :
 * exigerProfilSocial (409 pseudo-requis). 🔐 : routes qui lisent ou écrivent un texte, un titre ou un média (503
 * chiffrement-indisponible sans la clé). Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes
 * (Retry-After) ; 400 champ-invalide { champ } ; 400 message-refuse { champ } (filtre de mots). Compte limité par l'équipe
 * (refuserSiLimite, avant le profil social, la clé et le corps d'un média) : 403 compte-limite { details: { jusqua } } sur
 * POST /groupes, PATCH /:id, POST /:id/invites, PUT /:id/membres/:personne/role, POST /:id/messages, PATCH
 * /:id/messages/:messageId, POST /:id/medias, PUT /:id/photo et PUT des réactions ; le reste passe
 * (répondre à une invitation, quitter, couper, épingler, lu, effacer pour moi, supprimer son message ou la photo du groupe,
 * retirer sa réaction…).
 * - Ce que tu vois : les conversations dont tu es MEMBRE ; dans un groupe, on n'entre qu'en acceptant une invitation (avant :
 *   seulement l'invitation, ni les messages ni les membres). Les messages après ton arrivée (ou ton « Effacer pour moi »),
 *   sans ceux d'une personne avec qui il y a un blocage (dans un sens ou dans l'autre), ni ceux que tu as signalés. Un privé
 *   est « ouvert » si vous êtes toujours potes, sans blocage (sinon lecture seule) ; avec un blocage, il disparaît.
 * - Membres, rôles et titre : groupes seulement (privé : 404 conversation-inconnue ; sortie : 409 geree-par-la-sortie).
 * - 404 avant 403 : une conversation dont tu n'es pas membre répond 404 conversation-inconnue, même aux gestes d'un admin.
 * - Toute route avec :messageId passe par lireMessageVisible : sinon 404 message-inconnu.
 *
 * GET    /app/conversations[?apres=] 🔐 → 200 { ok, conversations: ConversationApi[], invitations: InvitationGroupeApi[], suite,
 *          epinglees? } 30 par page, la plus récente d'abord, sans les discussions des sorties, sans celles effacées pour toi
 *          tant qu'aucun message n'est arrivé ; invitations et epinglees (les 3 épinglées au plus, la dernière épinglée
 *          d'abord) : première page seulement
 * GET    /app/conversations/:id[?version=<n>][&avant=<messageId>] 🔐 → 200 { ok, fil: FilMessagesApi } (50 derniers messages,
 *          ou les 50 d'avant `avant`, du plus ancien au plus récent ; suite : à passer dans `avant` pour les plus anciens)
 *          | 200 { ok, inchange: true, version } (même version, sans avant) | 200 { ok, invitation: InvitationGroupeApi } (tu es
 *          invité, pas encore membre) · 404 conversation-inconnue
 * POST   /app/conversations/prive { personne } 🔐 → 201 { ok, conversation } (créée) | 200 (déjà là) · 404 personne-inconnue
 *          · 409 pas-dans-la-bande
 * POST   /app/conversations/groupes { titre, emoji, invites: string[] (1 à 19) } 🔐 (en-tête Idempotency-Key)
 *          → 201 { ok, conversation, ignores: string[] } (tu es admin ; chacun des invites de TA bande reçoit une invitation à
 *          accepter, « invitation-groupe » dans sa cloche) | 200 (même clé : déjà créé, personne n'est prévenu deux fois)
 *          · 400 champ-invalide | message-refuse { champ: "titre" | "emoji" | "invites" | "idClient" }
 *          · 409 pas-dans-la-bande (aucun invité de ta bande) | groupe-plein
 * PATCH  /app/conversations/:id { titre?, emoji? } 🔐 → 200 { ok, conversation } : admins · 404 · 409 geree-par-la-sortie
 *          · 403 reserve-aux-admins · 400
 * POST   /app/conversations/:id/invites { invites: string[] } 🔐 → 200 { ok, conversation, ignores } : un admin invite des potes
 *          de SA bande (20 personnes en tout, invitations en attente comprises). Ignorés sans le dire : déjà membres ou déjà
 *          invités (un refus compris), partis d'eux-mêmes depuis moins de 30 jours, inconnus, hors de ta bande, bloqués
 *          · 404 · 409 geree-par-la-sortie · 403 reserve-aux-admins · 409 pas-dans-la-bande | groupe-plein
 * POST   /app/conversations/:id/reponse { rejoint: boolean } 🔐 → 200 { ok, rejoint: true, conversation } (tu entres : la suite,
 *          pas l'historique) | 200 { ok, rejoint: false } (refus noté, sans prévenir personne) · 404 invitation-inconnue
 * DELETE /app/conversations/:id/membres/:personne → 200 { ok } : un admin retire un membre ou une invitation en attente, sans
 *          prévenir ; « moi » : quitter le groupe (pas de réinvitation pendant 30 jours) ; dernier admin parti : le plus ancien
 *          membre le devient ; plus personne : la conversation est effacée · 404 conversation-inconnue | personne-inconnue
 *          · 409 geree-par-la-sortie · 403 reserve-aux-admins
 * PUT    /app/conversations/:id/membres/:personne/role { role: "admin" | "membre" } 🔐 → 200 { ok, conversation } · 404
 *          · 409 geree-par-la-sortie · 403 reserve-aux-admins
 * PUT    /app/conversations/:id/notifications { coupees: boolean } → 200 { ok }
 * PUT    /app/conversations/:id/lu { jusqua: string } → 200 { ok } : ne recule jamais, ramené au dernier message visible pour
 *          toi ; montré aux autres membres (membres[].luJusqua, « Vu ») seulement entre deux personnes qui ont toutes les deux
 *          les accusés de lecture (la version monte alors)
 * PUT    /app/conversations/:id/epingle { epinglee: boolean } → 200 { ok } : 3 au plus · 409 trop-d-epinglees | geree-par-la-sortie
 * POST   /app/conversations/:id/effacer → 200 { ok } : « Effacer la discussion pour moi »
 * POST   /app/conversations/:id/messages { idClient, type: "texte" | "lieu", texte?, lieuId?, reponseA? } 🔐 → 201 { ok, message, version }
 *          (texte de 1 à 500 caractères ; lieu publié et son mot de 140 au plus, chiffrés ensemble ; chaque autre membre est
 *          prévenu sur son téléphone) | 200 (même idClient : rien de nouveau, aucune notification)
 *          · 400 champ-invalide | message-refuse { champ: "idClient" | "type" | "texte" | "lieuId" } · 404 conversation-inconnue
 *          | lieu-inconnu · 403 conversation-fermee · 400 reponse-introuvable · 429 (30 par minute)
 * PATCH  /app/conversations/:id/messages/:messageId { texte } 🔐 → 200 { ok, message, version } : ton texte, 15 min au plus
 *          après l'envoi · 404 message-inconnu · 403 pas-l-auteur | conversation-fermee · 409 trop-tard | non-modifiable
 * POST   /app/conversations/:id/medias 🔐 : corps brut (Content-Type image/jpeg, audio/mp4 ou audio/x-m4a ; 6 Mo au plus),
 *          en-têtes Idempotency-Key, X-Album, X-Legende et X-Onde → 201 { ok, message, version } | 200 (déjà reçu)
 *          · 400 champ-invalide { champ: "idClient" | "album" | "legende" } | onde-invalide · 409 album-plein
 *          · 400 media-invalide { champ: "format" | "dimensions" | "duree" } · 413 media-trop-lourd · 415 format-refuse
 *          · 404 · 403 conversation-fermee · 409 trop-de-medias (50 par 24 h, ou 1 Go gardé) · 503 stockage-plein (Retry-After)
 * GET    /app/conversations/:id/messages/:messageId/media 🔐 → 200 les octets (Content-Type du média, private, no-store)
 *          · 404 message-inconnu · 410 media-expire (expiré, supprimé, suspendu ou retiré)
 * PUT    /app/conversations/:id/photo 🔐 : corps brut JPEG → 200 { ok, conversation } ; DELETE (même adresse) 🔐 → 200 { ok,
 *          conversation } : admins d'un groupe · 404 · 409 geree-par-la-sortie · 403 reserve-aux-admins · mêmes refus qu'un média
 * GET    /app/conversations/:id/photo 🔐 → 200 les octets (image/jpeg, private, no-store) · 404 conversation-inconnue | photo-inconnue
 * GET    /app/conversations/:id/partages?type=photo|lieu[&avant=<messageId>] 🔐 → 200 { ok, messages, suite } : 30 par page,
 *          le plus récent d'abord
 * DELETE /app/conversations/:id/messages/:messageId → 200 { ok, version } : ton message, pour tout le monde · 404
 *          message-inconnu · 403 reserve-a-l-auteur
 * PUT    /app/conversations/:id/messages/:messageId/reactions/:reaction ; DELETE (même adresse) → 200 { ok, version } :
 *          coeur, rire, miam, pouce ou surprise, cumulables · 400 champ-invalide { champ: "reaction" } · 404 message-inconnu
 *          · 403 conversation-fermee
 */
export function creerRoutesConversations(d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursConversations(d, contexte);
  const m = creerControleursMediasChat(d, contexte);
  const { lectures, gestes, parCompte, refuserSiLimite } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const cle = exigerChiffrementSocial(d.chiffrement);
  const lireCorpsBrut = express.raw({ type: TYPES_MEDIAS_CHAT, limit: TAILLE_MAX_CORPS_MEDIA });
  /** Le corps brut d'un média, lu en dernier (après la session, le profil et les limites) ; trop gros : 413 media-trop-lourd */
  const corpsMedia: RequestHandler = (requete, reponse, suite) => {
    lireCorpsBrut(requete, reponse, (erreur?: unknown) => {
      if (erreur && (erreur as { type?: string }).type === "entity.too.large") return suite(refuserSocial("media-trop-lourd", ERREURS_MEDIAS_CHAT));
      suite(erreur);
    });
  };

  const limiteMessages = parCompte(LIMITE_MESSAGES);
  const limiteMedias = parCompte(LIMITE_MEDIAS);
  const limiteMediasIp = limiterEnvoisMedias();

  const routes = Router();
  routes.get("/", lectures, lireProfilSocial, cle, c.lister);
  routes.post("/prive", gestes, exigerProfilSocial, cle, c.ouvrirPrive);
  routes.post("/groupes", parCompte(LIMITE_CREATIONS_GROUPES), refuserSiLimite, exigerProfilSocial, cle, c.creerGroupe);
  routes.get("/:id", lectures, lireProfilSocial, cle, c.lireFil);
  routes.patch("/:id", gestes, refuserSiLimite, exigerProfilSocial, cle, c.modifierGroupe);
  routes.post("/:id/invites", gestes, refuserSiLimite, exigerProfilSocial, cle, c.inviter);
  routes.post("/:id/reponse", gestes, exigerProfilSocial, cle, c.repondre);
  routes.delete("/:id/membres/:personne", gestes, exigerProfilSocial, c.retirerMembre);
  // Compte limité : il ne redistribue pas les pouvoirs d'un groupe (décision de Hugo du 15/10/2026) ; retirer quelqu'un reste permis
  routes.put("/:id/membres/:personne/role", gestes, refuserSiLimite, exigerProfilSocial, cle, c.changerRole);
  routes.put("/:id/notifications", gestes, exigerProfilSocial, c.couper);
  routes.put("/:id/lu", gestes, exigerProfilSocial, c.marquerLu);
  routes.put("/:id/epingle", gestes, exigerProfilSocial, c.epingler);
  routes.post("/:id/effacer", gestes, exigerProfilSocial, c.effacerPourMoi);
  routes.post("/:id/messages", limiteMessages, refuserSiLimite, exigerProfilSocial, cle, c.envoyer);
  routes.patch("/:id/messages/:messageId", limiteMessages, refuserSiLimite, exigerProfilSocial, cle, c.modifierMessage);
  routes.post("/:id/medias", limiteMediasIp, limiteMedias, refuserSiLimite, exigerProfilSocial, cle, corpsMedia, m.envoyerMedia);
  routes.get("/:id/messages/:messageId/media", lectures, lireProfilSocial, cle, m.lireMedia);
  routes.put("/:id/photo", limiteMediasIp, limiteMedias, refuserSiLimite, exigerProfilSocial, cle, corpsMedia, m.changerPhoto);
  routes.delete("/:id/photo", gestes, exigerProfilSocial, cle, m.retirerPhoto);
  routes.get("/:id/photo", lectures, lireProfilSocial, cle, m.lirePhoto);
  routes.get("/:id/partages", lectures, lireProfilSocial, cle, c.listerPartages);
  routes.delete("/:id/messages/:messageId", gestes, exigerProfilSocial, c.supprimerMessage);
  routes.put("/:id/messages/:messageId/reactions/:reaction", gestes, refuserSiLimite, exigerProfilSocial, c.reagir(true));
  routes.delete("/:id/messages/:messageId/reactions/:reaction", gestes, exigerProfilSocial, c.reagir(false));
  return routes;
}
