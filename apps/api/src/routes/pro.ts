import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursCartePro } from "../controleurs/pro-carte.ts";
import { creerControleursEquipe } from "../controleurs/pro-equipe.ts";
import { creerControleursFichePro } from "../controleurs/pro-fiche.ts";
import { creerControleursRattachements } from "../controleurs/pro-rattachements.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { creerProtectionPro } from "../middlewares/proteger-pro.ts";
import type { ServicesPro } from "../services/pro-regles.ts";

/** « Chercher mon lieu » : 60 recherches par visiteur toutes les 10 minutes */
export const LIMITE_RECHERCHE_LIEUX = { fenetre: 10 * 60_000, maximum: 60 };
/** Modifier sa fiche : 60 envois par visiteur et par heure */
export const LIMITE_MODIFIER_FICHE = { fenetre: 60 * 60_000, maximum: 60 };
/** Enregistrer sa carte : 60 enregistrements par COMPTE et par heure (en plus de la limite par visiteur de l'espace) */
export const LIMITE_ENREGISTRER_CARTE = { fenetre: 60 * 60_000, maximum: 60 };
/** Inviter dans son équipe : 20 envois par visiteur et par heure (en plus : 30 essais par gérant et par 24 h, 10
 * invitations par lieu et par 24 h, 30 membres au plus) */
export const LIMITE_INVITATIONS = { fenetre: 60 * 60_000, maximum: 20 };

/**
 * /pro/… : espace pro (pro.sosmiam.fr), appelé seulement par le serveur du site, avec la session du compte unique
 * (en-tête X-Session-Compte, IP du visiteur dans X-IP-Visiteur) : mêmes conventions que routes/comptes.ts, jamais en
 * cache. Toute adresse demande une session (401 « session-expiree » sinon) ; 429 « trop-de-demandes » au-delà des limites.
 * Toute adresse est réservée aux 18 ans et plus, AVANT le reste (même un lieu inconnu) : âge connu sous 18 ans → 403
 * reserve-aux-majeurs ; date de naissance gardée mais illisible (clé absente) → 503 chiffrement-indisponible ; un compte
 * sans date gardée (compte du site, qui a prouvé 18 ans) passe.
 * Le compte connecté voit ses lieux dans `compte.pro.lieux` ; ses demandes : /comptes/moi/rattachements (routes/comptes.ts).
 *
 * GET    /pro/recherche-lieux?texte=…   (tout compte connecté) chercher son lieu : chaque mot (2 à 80 caractères en tout,
 *                                        5 mots au plus) dans le nom ou la ville, lieux publiés ou en brouillon, 10 au plus,
 *                                        rangés par nom → 200 { ok, lieux: [{ id, nom, emoji, type, quartier, ville,
 *                                        statut: "publie"|"brouillon", estVerifie }] } · 400 champ-invalide {champ: "texte"}
 * Rattachement VALIDÉ au lieu :id obligatoire, sinon 403 pas-pro (aussi pour un lieu inconnu) ; « gérant » seulement
 * là où c'est écrit, sinon 403 reserve-au-gerant (un membre « equipe » lit, mais ne modifie pas) :
 * GET    /pro/lieux/:id                 → 200 { ok, fiche, role: "gerant"|"equipe", peutModifier } ; fiche : { id, nom,
 *                                        adresse, type, emoji, info, quartier, ville, statut ("publie", "brouillon" ou
 *                                        "masque"), horaires, texte, telephone, siteWeb, instagram, animaux, accessible,
 *                                        terrasse, wifi, enfants, parking, paiements[], reservation, estVerifie } (null :
 *                                        info inconnue ; horaires et texte : "" s'ils sont vides)
 * PATCH  /pro/lieux/:id    (gérant)     { horaires?, texte?, telephone?, siteWeb?, instagram?, animaux?, accessible?,
 *                                        terrasse?, wifi?, enfants?, parking?, paiements?, reservation?, nom?, adresse?,
 *                                        message? } → 200 { ok, appliques: string[], envoyesAEquipe: ("nom"|"adresse")[],
 *                                        suggestionId: number|null, fiche }
 *                                        · les champs directs sont vérifiés par validerPropositionLieu (packages/commun) et
 *                                          écrits TOUT DE SUITE ; null, "" ou [] EFFACE l'info (redevient inconnue ; horaires
 *                                          et texte deviennent "") ; `appliques` : seulement ceux qui changent vraiment
 *                                        · nom et adresse ne changent PAS la fiche : s'ils diffèrent, une suggestion « pro »
 *                                          (avec message, « Pourquoi ? », facultatif) part à l'équipe ; ils ne s'effacent pas
 *                                        · rien qui change : 200 avec deux listes vides
 *                                        · 400 proposition-invalide {champ} (nom, adresse, horaires, texte, telephone,
 *                                          siteWeb, instagram, message, « vide » : rien d'envoyé, « autre » : champ inconnu
 *                                          ou valeur hors liste) · 409 trop-de-suggestions (nom/adresse : 10 suggestions
 *                                          par 24 h par compte, 3 en attente sur le lieu ; alors RIEN n'est appliqué)
 * GET    /pro/lieux/:id/suggestions     → 200 { ok, suggestions: [{ id, source: "client"|"pro", champs[], avant,
 *                                        proposition, message, statut ("en-attente", "acceptee", "partielle", "refusee"),
 *                                        champsAcceptes[], reponse (réponse de l'équipe, seulement pour source "pro" ;
 *                                        sinon null), creeLe, decideLe }] } : les 100 plus récentes d'abord, JAMAIS l'auteur
 * GET    /pro/lieux/:id/carte           → 200 { ok, carte: CarteLieu | null, majLe: string | null } : la carte du lieu
 *                                        (gérant et équipe). CarteLieu (packages/commun, types/carte.ts) : { sections:
 *                                        [{ titre, elements: [{ nom, description?, prix (en euros, 12 ou 4.5), unite?,
 *                                        signature?: true, alcool?: true, etiquettes?: ("vege"|"vegan"|"sans-gluten"|"epice"|
 *                                        "fait-maison"|"local")[] }] }], majLe: "AAAA-MM-JJ" (jour de Paris) } ; majLe à part :
 *                                        le moment exact (ISO 8601) ; carte null (et majLe null) : pas de carte
 * PUT    /pro/lieux/:id/carte (gérant)  { carte: CarteLieu | null } → 200 { ok, carte, majLe } (comme le GET, à jour)
 *                                        · la carte REMPLACE la précédente ; vérifiée par validerCarteDuLieu (packages/commun) :
 *                                          20 sections, 60 éléments par section, 250 en tout, LIMITES_CARTE pour les textes
 *                                          et le prix ; une section vide est permise ; le majLe envoyé est ignoré : la date
 *                                          est posée par le serveur (maintenant)
 *                                        · { carte: null }, ou une carte sans aucune section : la carte est EFFACÉE (majLe null)
 *                                        · 400 carte-invalide { champ, section, element } : le PREMIER endroit à corriger,
 *                                          section et element comptés à partir de 0 (null : toute la carte) ; champ : "titre",
 *                                          "nom", "description", "prix", "unite", "etiquettes", "trop-de-sections",
 *                                          "trop-d-elements" ou "autre" (forme inattendue, ou { carte } absent)
 *                                        · 429 trop-de-demandes : 60 enregistrements par compte et par heure ; corps jusqu'à 300 Ko
 * GET    /pro/lieux/:id/equipe  (gérant) → 200 { ok, equipe: [{ compteId, prenom, email (null pour un gérant), role,
 *                                        statut: "en-attente"|"valide", creeLe, decideLe }] } (gérants validés d'abord)
 * POST   /pro/lieux/:id/equipe  (gérant) { email } → 201 { ok } : invitation « equipe » « en-attente », que l'employé
 *                                        accepte (POST /comptes/moi/rattachements/:id/accepter)
 *                                        · 400 champ-invalide {champ: "email"} · 404 compte-inconnu {message} (aucun compte
 *                                          à cette adresse : la personne crée d'abord son compte) · 409 compte-mineur
 *                                          {message} (âge connu sous 18 ans ; jamais l'âge lui-même) · 409 deja-membre (invité
 *                                          ou validé, gérant compris) · 503 chiffrement-indisponible (date de l'invité illisible) · 409 trop-d-invitations (10 par lieu et par 24 h)
 *                                          · 409 equipe-complete (30) · 429 (30 essais par gérant et par 24 h ; 20 par
 *                                          visiteur et par heure)
 * DELETE /pro/lieux/:id/equipe/:compteId (gérant) → 200 { ok } (statut « retire ») · 404 membre-inconnu (pas un membre
 *                                        « equipe » invité ou validé : un gérant ne se retire pas ici)
 */
export function creerRoutesPro(
  services: ServicesPro, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number = Date.now,
  /** Réservé aux 18 ans et plus (middlewares/exiger-majeur.ts) */
  exigerMajeur: RequestHandler,
) {
  const exigerRattachement = creerProtectionPro(services);
  const rattachements = creerControleursRattachements(services, horloge);
  const fiche = creerControleursFichePro(services, horloge);
  const equipe = creerControleursEquipe(services, horloge);
  const carte = creerControleursCartePro(services, horloge);
  const limiteCarte = limiterRequetes({ ...LIMITE_ENREGISTRER_CARTE, cle: (_requete, reponse) => `compte:${lireCompteId(reponse)}` });
  const routes = Router();

  routes.use(limiteConnectee, protection.exigerCompte, exigerMajeur);
  routes.get("/recherche-lieux", limiterRequetes(LIMITE_RECHERCHE_LIEUX), rattachements.chercher);
  routes.get("/lieux/:id", exigerRattachement(), fiche.lire);
  routes.patch("/lieux/:id", limiterRequetes(LIMITE_MODIFIER_FICHE), exigerRattachement(true), fiche.modifier);
  routes.get("/lieux/:id/suggestions", exigerRattachement(), fiche.suggestions);
  routes.get("/lieux/:id/carte", exigerRattachement(), carte.lire);
  routes.put("/lieux/:id/carte", limiteCarte, exigerRattachement(true), carte.enregistrer);
  routes.get("/lieux/:id/equipe", exigerRattachement(true), equipe.lister);
  routes.post("/lieux/:id/equipe", limiterRequetes(LIMITE_INVITATIONS), exigerRattachement(true), equipe.inviter);
  routes.delete("/lieux/:id/equipe/:compteId", exigerRattachement(true), equipe.retirer);
  routes.use(gererErreursComptes);
  return routes;
}
