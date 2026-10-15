import { Router } from "express";

import { creerControleursCommunaute, lireVisibleDemande } from "../controleurs/communaute.ts";
import { creerControleursIdees } from "../controleurs/communaute-idees.ts";
import { creerControleursSortiesMiamis } from "../controleurs/communaute-sorties.ts";
import { creerRefuserSiLimiteSi } from "../middlewares/refuser-si-limite-selon.ts";
import type { ServicesCommunaute } from "../services/communaute-regles.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

export const LIMITE_CREATIONS_SORTIES_MIAMIS = { fenetre: 24 * 60 * 60_000, maximum: 10 };
export const LIMITE_DEMANDES_SORTIES_MIAMIS = { fenetre: 24 * 60 * 60_000, maximum: 30 };
export const LIMITE_COUCOUS = { fenetre: 60 * 60_000, maximum: 30 };
export const LIMITE_IDEES = { fenetre: 24 * 60 * 60_000, maximum: 5 };
export const LIMITE_COMMENTAIRES_IDEES = { fenetre: 60 * 60_000, maximum: 30 };

/**
 * /app/communaute (décision de Hugo des 14 et 15 octobre 2026, docs/decisions.md « Espace communauté ») : session obligatoire
 * (Authorization: Bearer), jamais en cache ; lectures : lireProfilSocial ; écritures : exigerProfilSocial (409 pseudo-requis),
 * sauf le genre (lireProfilSocial : pas besoin de pseudo). Identifiants : :id entier, :personne identifiant public. Erreurs
 * { ok: false, erreur, champ?, details? } : 401 session-expiree ; 429 trop-de-demandes ; 400 champ-invalide { champ } ou
 * message-refuse { champ } (filtre de mots) ; 503 chiffrement-indisponible (genre, sans clé des données).
 * Compte limité (403 compte-limite { details: { jusqua } }) : organiser une sortie, demander à venir, se montrer dans « Qui est
 * là ? » (PUT { visible: true } seulement), faire coucou, proposer une idée, la commenter. Tout le reste passe.
 * Blocages dans les deux sens : une sortie dont l'organisateur (ou un participant accepté) a un blocage avec toi n'existe pas
 * pour toi (404 sortie-inconnue), et tu ne peux pas la rejoindre ; on ne voit jamais une personne avec qui il y a un blocage.
 *
 * Sorties des Miamis (SortieMiamisApi) : un lieu publié, 6 places au plus (organisateur compris), un public réservé
 * invisible des autres (le genre déclaré n'est jamais montré), l'organisateur accepte chaque arrivée.
 * GET    /sorties                         → 200 { ok, sorties } : à venir dans la ville de ton profil (celles que tu peux
 *          voir), plus les tiennes (jusqu'à 4 h après leur début), de la plus proche à la plus lointaine, 100 au plus
 * GET    /sorties/:id                     → 200 { ok, sortie } · 404 sortie-inconnue
 * POST   /sorties (Idempotency-Key) NouvelleSortieMiamis → 201 { ok, sortie } | 200 (même clé : déjà créée)
 *          · 400 champ-invalide | message-refuse { champ } · 404 lieu-inconnu (pas publié) · 403 public-reserve (tu n'es pas
 *          dans ce public ; « les nouveaux » s'organise par tous) · 409 trop-de-sorties-miamis (5 à venir) · 429 (10 par 24 h)
 * POST   /sorties/:id/demande             → 200 { ok, sortie } : « Je viens » (moi.place « demande » ; un habitué invité
 *          entre tout de suite) ; l'organisateur est prévenu (demande-sortie-miamis) · 404 sortie-inconnue · 409 sortie-passee
 *          · 429 (30 par 24 h)
 * DELETE /sorties/:id/demande             → 200 { ok, sortie } : annule ta demande
 * DELETE /sorties/:id/participation       → 200 { ok, sortie } : « Je ne peux plus venir » (acceptée, en attente, habitué
 *          invité) ; moins de 24 h avant, compté dans « Sorties tenues » ; la première personne en attente qui le peut entre
 *          (place-liberee-miamis)
 * POST   /sorties/:id/demandes/:personne  → 200 { ok, sortie } : l'organisateur accepte (arrivee-acceptee, la discussion
 *          s'ouvre) ; complet : liste d'attente (liste-attente-miamis) · 403 reserve-a-l-organisateur · 404 demande-inconnue
 *          (plus de demande, ou la personne ne peut plus venir : blocage, public) · 409 sortie-passee
 * DELETE /sorties/:id/demandes/:personne  → 200 { ok, sortie } : refus silencieux (la personne voit toujours « demande »)
 * DELETE /sorties/:id/participants/:personne → 200 { ok, sortie } : l'organisateur retire quelqu'un, sans le prévenir
 *          · 404 personne-inconnue
 * POST   /sorties/:id/presence            → 200 { ok, sortie } : après le QR du comptoir (POST /app/visites/comptoir), de 1 h
 *          avant à 4 h après le début · 409 presence-non-validee | presence-fermee
 * DELETE /sorties/:id                     → 200 { ok } : l'organisateur annule (sortie-miamis-annulee dans la cloche de tous)
 *          · 403 reserve-a-l-organisateur · 409 sortie-passee
 *
 * Mon genre (GenreProfil, chiffré, vu par personne) :
 * GET    /genre                           → 200 { ok, genre }
 * PUT    /genre { choix }                 → 200 { ok, genre } · 409 genre-trop-tot { details: { jusqua } } (femme, homme ou
 *          autres : une fois par mois ; « ne-pas-dire » passe toujours, sans remettre le délai à zéro)
 * DELETE /genre                           → 200 { ok, genre } : effacé (le délai reste compté)
 *
 * « Qui est là ? » (seulement le pseudo et l'avatar ; la ville du profil, jamais une position) :
 * GET    /qui-est-la                      → 200 { ok, ville, visible, jusqua, total, presents } (jusqua null hors présence)
 * PUT    /qui-est-la { visible }          → 200 { ok, visible, jusqua } : vrai, te montre 3 h (à rappeler pour rester) ; faux,
 *          tu disparais tout de suite, tes coucous avec · 409 ville-requise
 * POST   /coucous/:personne               → 200 { ok, coucou } (« envoye » ou « reciproque » : coucou-reciproque chez l'autre)
 *          · 409 invisible-ici · 404 personne-inconnue (partie, cachée, autre ville, blocage) · 429 (30 par heure)
 *
 * Boîte à idées (IdeeMiamis, CommentaireIdee) :
 * GET    /idees                           → 200 { ok, idees } : publiées, plus les tiennes en relecture (300 au plus)
 * GET    /idees/:id                       → 200 { ok, idee, commentaires } · 404 idee-inconnue
 * POST   /idees (Idempotency-Key) { titre, detail } → 201 { ok, idee } (« en-relecture ») | 200 (même clé)
 *          · 409 idee-proche (la même phrase existe) · 429 (5 par 24 h)
 * DELETE /idees/:id                       → 200 { ok } · 403 reserve-a-l-auteur
 * PUT    /idees/:id/vote, DELETE /idees/:id/vote → 200 { ok, idee } · 409 idee-en-relecture
 * POST   /idees/:id/commentaires { texte, reponseA? } → 201 { ok, commentaire } · 404 commentaire-inconnu (reponseA)
 *          · 409 idee-en-relecture · 429 (30 par heure)
 * DELETE /commentaires-idees/:id          → 200 { ok } · 403 reserve-a-l-auteur · 404 commentaire-inconnu
 * PUT    /commentaires-idees/:id/jaime, DELETE … → 200 { ok, commentaire }
 *
 * GET    /fil                             → 200 { ok, evenements } : « Ça bouge chez les Miamis », 7 jours, 30 au plus
 */
export function creerRoutesCommunaute(communaute: ServicesCommunaute, d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursCommunaute(communaute, d, contexte);
  const s = creerControleursSortiesMiamis(communaute, d, contexte);
  const i = creerControleursIdees(communaute, d, contexte);
  const { lectures, gestes, refuserSiLimite, parCompte } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const seMontrer = creerRefuserSiLimiteSi(refuserSiLimite, (requete) => lireVisibleDemande(requete) === true);
  const routes = Router();

  routes.get("/sorties", lectures, lireProfilSocial, s.lister);
  routes.post("/sorties", parCompte(LIMITE_CREATIONS_SORTIES_MIAMIS), refuserSiLimite, exigerProfilSocial, s.creer);
  routes.get("/sorties/:id", lectures, lireProfilSocial, s.lire);
  routes.delete("/sorties/:id", gestes, exigerProfilSocial, s.annuler);
  routes.post("/sorties/:id/demande", parCompte(LIMITE_DEMANDES_SORTIES_MIAMIS), refuserSiLimite, exigerProfilSocial, s.demander);
  routes.delete("/sorties/:id/demande", gestes, exigerProfilSocial, s.annulerDemande);
  routes.delete("/sorties/:id/participation", gestes, exigerProfilSocial, s.quitter);
  routes.post("/sorties/:id/demandes/:personne", gestes, exigerProfilSocial, s.accepter);
  routes.delete("/sorties/:id/demandes/:personne", gestes, exigerProfilSocial, s.refuser);
  routes.delete("/sorties/:id/participants/:personne", gestes, exigerProfilSocial, s.retirer);
  routes.post("/sorties/:id/presence", gestes, exigerProfilSocial, s.validerPresence);

  routes.get("/genre", lectures, lireProfilSocial, c.lireGenre);
  routes.put("/genre", gestes, lireProfilSocial, c.choisirGenre);
  routes.delete("/genre", gestes, lireProfilSocial, c.effacerGenre);

  routes.get("/qui-est-la", lectures, lireProfilSocial, c.lireQuiEstLa);
  routes.put("/qui-est-la", gestes, seMontrer, exigerProfilSocial, c.choisirVisibilite);
  routes.post("/coucous/:personne", parCompte(LIMITE_COUCOUS), refuserSiLimite, exigerProfilSocial, c.faireCoucou);

  routes.get("/idees", lectures, lireProfilSocial, i.lister);
  routes.post("/idees", parCompte(LIMITE_IDEES), refuserSiLimite, exigerProfilSocial, i.proposer);
  routes.get("/idees/:id", lectures, lireProfilSocial, i.lire);
  routes.delete("/idees/:id", gestes, exigerProfilSocial, i.retirer);
  routes.put("/idees/:id/vote", gestes, exigerProfilSocial, i.voter(true));
  routes.delete("/idees/:id/vote", gestes, exigerProfilSocial, i.voter(false));
  routes.post("/idees/:id/commentaires", parCompte(LIMITE_COMMENTAIRES_IDEES), refuserSiLimite, exigerProfilSocial, i.commenter);
  routes.delete("/commentaires-idees/:id", gestes, exigerProfilSocial, i.supprimerCommentaire);
  routes.put("/commentaires-idees/:id/jaime", gestes, exigerProfilSocial, i.aimerCommentaire(true));
  routes.delete("/commentaires-idees/:id/jaime", gestes, exigerProfilSocial, i.aimerCommentaire(false));

  routes.get("/fil", lectures, lireProfilSocial, c.lireFil);
  return routes;
}
