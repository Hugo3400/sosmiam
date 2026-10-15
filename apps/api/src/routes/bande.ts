import { Router } from "express";

import { creerControleursBande } from "../controleurs/bande.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Essais de lien ou de QR d'invitation, par compte (contre les essais de codes au hasard) */
export const LIMITE_ESSAIS_INVITATION = { fenetre: 10 * 60_000, maximum: 20 };
/** Les mêmes, par IP (plusieurs comptes derrière une même connexion) */
export const LIMITE_ESSAIS_INVITATION_IP = { fenetre: 10 * 60_000, maximum: 40 };
/** Demandes de bande par le pseudo, par compte */
export const LIMITE_DEMANDES_BANDE = { fenetre: 24 * 60 * 60_000, maximum: 50 };

/**
 * /app/bande et /app/blocages : session obligatoire (Authorization: Bearer), jamais en cache. Lectures : lireProfilSocial
 * (sans profil social : bande, activité et classement vides ; rien n'est créé) ; écritures et GET /app/bande/invitation
 * (créer son lien est un geste volontaire) : exigerProfilSocial (409 pseudo-requis). /app/blocages : lireProfilSocial (pas
 * besoin de pseudo pour bloquer). Une personne est désignée par son identifiant public (:personne, 10 caractères). Erreurs
 * { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ; 400 champ-invalide { champ } ;
 * 503 chiffrement-indisponible (🔐, sans la clé des données). Compte limité par l'équipe (refuserSiLimite, avant la clé et le
 * profil social) : 403 compte-limite { details: { jusqua } } sur POST /rejoindre et POST /demandes ; le reste passe.
 *
 * GET    /app/bande                → 200 { ok, bande: BandeApi } : tes potes (du plus récent au plus ancien), demandes reçues
 *          (sans celles que tu as refusées) et envoyées (refusées comprises : tu ne sais pas qu'elles l'ont été), 50 chacune au
 *          plus, max (200)
 * GET    /app/bande/invitation 🔐  → 200 { ok, invitation: InvitationBandeApi } : ton code et ton lien
 *          (« https://sosmiam.fr/invitation/<pseudo>#c=<code> ») ; le code est créé à la première demande, le même sur tous
 *          tes téléphones, sans date de fin
 * POST   /app/bande/invitation/renouveler 🔐 → 201 { ok, invitation } : nouveau code ; l'ancien lien et l'ancien QR ne
 *          marchent plus, tout de suite
 * POST   /app/bande/rejoindre 🔐 { pseudo: string, code: string, moyen: "lien" | "qr" }
 *          → 201 { ok, personne: PersonneResume, deja: false } : vous voilà dans les deux bandes ; les demandes entre vous sont
 *            effacées ; l'autre reçoit « bande-ajout » dans sa cloche (avec « Retirer » en un geste) et sur son téléphone
 *          → 200 { ok, personne, deja: true } : déjà potes, rien ne change
 *          · 400 champ-invalide { champ: "pseudo" | "code" | "moyen" } (ton propre lien : { champ: "pseudo" })
 *          · 404 invitation-invalide : pseudo inconnu, code faux ou changé, lien qui a trop tourné, ou blocage dans un sens
 *            ou dans l'autre (la même réponse, pour ne rien laisser deviner)
 *          · 404 invitation-inconnue : l'ancien lien d'un pote qui a changé de pseudo depuis (le pseudo d'avant, réservé 30
 *            jours) : il faut son nouveau lien. Seulement avec son bon code et sans blocage : sinon invitation-invalide (un
 *            pseudo réservé ne se devine pas) ; rien n'est écrit
 *          · 409 bande-pleine (l'une des deux bandes a déjà 200 potes)
 *          · 429 : 20 essais par 10 minutes par compte, et 40 par IP
 *          Lien qui a fuité : la 10e arrivée en 24 h par un même lien passe ; juste après, le code change tout seul et son
 *          propriétaire reçoit « lien-renouvele » dans sa cloche ; les arrivées suivantes par l'ancien code : 404
 * POST   /app/bande/demandes { personne: string }
 *          → 201 { ok, etat: "demande" } : elle la voit dans ses demandes (pas de notification sur son téléphone) ; sauf si
 *            elle a éteint « Qu'on me trouve par mon pseudo » : on n'entre dans sa bande que par son lien, et la demande part
 *            refusée d'office, en silence (tu vois « envoyée », elle ne voit rien ; choix de construction)
 *          → 200 { ok, etat: "ajoute", personne } : elle t'avait déjà demandé (même si tu avais refusé), vous voilà potes
 *            (« bande-acceptee » pour elle)
 *          → 200 { ok, etat: "deja" } : déjà potes, demande déjà envoyée, ou déjà refusée par elle (en silence : tu vois
 *            « envoyée », jusqu'à l'expiration à 30 jours)
 *          · 400 champ-invalide { champ: "personne" } (toi) · 404 personne-inconnue (inconnue, ou blocage) · 409 bande-pleine
 *          | trop-de-demandes-en-attente (50 envoyées) · 429 (50 par 24 h)
 * POST   /app/bande/demandes/:personne/accepter → 200 { ok, personne } (« bande-acceptee » pour elle)
 *          · 404 demande-inconnue · 409 bande-pleine
 * DELETE /app/bande/demandes/:personne → 200 { ok } : refuse une demande reçue (sans prévenir : elle ne revient pas, et ne
 *          peut pas être renvoyée avant 30 jours), ou annule la tienne (effacée)
 * DELETE /app/bande/:personne      → 200 { ok } : retire des deux bandes, sans prévenir. Votre discussion privée passe en
 *          lecture seule ; les co-auteurs entre vous (listes de l'un remplies par l'autre) partent, leurs lieux restent. Pas
 *          pote : 200
 * GET    /app/bande/activite       → 200 { ok, activites: ActiviteBandeApi[] } : « Quoi de neuf », 30 derniers jours, 50 au
 *          plus, du plus récent au plus ancien ; seulement les potes qui partagent leur activité ; sans les lignes retirées de
 *          ta vue (PUT /app/masques/activite/<id de la ligne>)
 * GET    /app/bande/classement     → 200 { ok, classement: ClassementApi } : toi et tes potes qui partagent leur activité,
 *          sur les points nets du mois en cours à l'heure de Paris, puis les rescousses du mois ; même rang à égalité
 *
 * GET    /app/blocages             → 200 { ok, bloques: PersonneResume[] } (Réglages › Personnes bloquées)
 * PUT    /app/blocages/:personne   → 200 { ok } : bloque. La personne est trouvée même si ELLE t'a bloqué, et la réponse est
 *          toujours 200 (déjà bloquée comprise) : ce n'est jamais un indice. Dans les deux sens, entre vous : bande, demandes,
 *          suivis, co-auteurs et abonnements aux listes de l'autre, invitations en attente (groupes et sorties), cloche ; et
 *          elle sort des sorties où tu as la main (invitation, discussion et votes), sans prévenir
 *          · 400 champ-invalide { champ: "personne" } (toi) · 404 personne-inconnue (identifiant inconnu seulement) · 409
 *          trop-de-blocages (1 000)
 * DELETE /app/blocages/:personne   → 200 { ok } : débloque, sans rien rétablir (même recherche que PUT)
 */
export function creerRoutesBande(d: Pick<DependancesSocialApp, "bande" | "relations" | "chiffrement">, contexte: ContexteRoutesSociales) {
  const c = creerControleursBande(d, contexte.appliquer, contexte.horloge);
  const { lectures, gestes, refuserSiLimite } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  // La clé avant le profil : sans elle, rien n'est créé
  const cle = exigerChiffrementSocial(d.chiffrement);
  const essais = [contexte.parCompte(LIMITE_ESSAIS_INVITATION), limiterRequetes(LIMITE_ESSAIS_INVITATION_IP)];

  const bande = Router();
  bande.get("/", lectures, lireProfilSocial, c.lireBande);
  bande.get("/invitation", lectures, cle, exigerProfilSocial, c.lireInvitation);
  bande.post("/invitation/renouveler", gestes, cle, exigerProfilSocial, c.renouvelerInvitation);
  bande.post("/rejoindre", gestes, ...essais, refuserSiLimite, cle, exigerProfilSocial, c.rejoindre);
  bande.post("/demandes", gestes, contexte.parCompte(LIMITE_DEMANDES_BANDE), refuserSiLimite, exigerProfilSocial, c.demander);
  bande.post("/demandes/:personne/accepter", gestes, exigerProfilSocial, c.accepter);
  bande.delete("/demandes/:personne", gestes, exigerProfilSocial, c.retirerDemande);
  bande.get("/activite", lectures, lireProfilSocial, c.lireActivite);
  bande.get("/classement", lectures, lireProfilSocial, c.lireClassement);
  bande.delete("/:personne", gestes, exigerProfilSocial, c.retirer);

  const blocages = Router();
  blocages.get("/", lectures, lireProfilSocial, c.listerBloques);
  blocages.put("/:personne", gestes, lireProfilSocial, c.bloquer(true));
  blocages.delete("/:personne", gestes, lireProfilSocial, c.bloquer(false));

  return { bande, blocages };
}
