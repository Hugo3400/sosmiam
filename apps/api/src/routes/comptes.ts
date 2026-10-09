import { Router, type RequestHandler } from "express";

import { creerAttenteParCompte } from "../controleurs/comptes-attente.ts";
import { creerControleursCertification } from "../controleurs/comptes-certification.ts";
import { creerControleursEspaceComptes } from "../controleurs/comptes-espace.ts";
import { creerControleursMonCompte } from "../controleurs/comptes-moi.ts";
import { ADRESSE_ESPACE, creerControleursLiens, type CourrielsComptes } from "../controleurs/comptes-liens.ts";
import { creerLimiteEnvois } from "../controleurs/comptes-limite-envois.ts";
import { creerControleursSuggestions } from "../controleurs/comptes-suggestions.ts";
import { creerControleursComptes, type ServicesComptes } from "../controleurs/comptes.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes, type StockageSessionsComptes } from "../middlewares/proteger-comptes.ts";
import type { ServicesZones } from "../services/zones-fondateurs.ts";

const DIX_MINUTES = 10 * 60_000;
/**
 * Adresses de la personne connectée (et l'espace ambassadeur) : 600 appels d'API par visiteur toutes les 10 minutes. Une
 * page en coûte plusieurs (/espace : 5 ; le kit média : 18 avec ses aperçus), et une IP peut être partagée (box, Wi-Fi).
 * Les routes qui vérifient un mot de passe gardent en plus l'attente par compte et la file des calculs.
 */
export const LIMITE_CONNECTEE = { fenetre: DIX_MINUTES, maximum: 600 };
/** « Mot de passe oublié » : 5 demandes par visiteur et par heure (en plus de la limite par compte : 1 lien toutes les
 * 15 minutes, 5 par 24 heures) */
export const LIMITE_MOT_DE_PASSE_OUBLIE = { fenetre: 60 * 60_000, maximum: 5 };
/** Confirmation de l'e-mail par le lien reçu : 20 essais par visiteur toutes les 10 minutes */
export const LIMITE_VERIFIER_EMAIL = { fenetre: DIX_MINUTES, maximum: 20 };
/** « Proposer une modification » d'une fiche : 20 envois par visiteur et par heure (en plus des limites par compte : 10
 * par 24 heures, 3 en attente sur un même lieu) */
export const LIMITE_SUGGESTIONS = { fenetre: 60 * 60_000, maximum: 20 };

export type DependancesComptes = {
  services: ServicesComptes;
  /** Où garder les sessions (la base en vrai : services/stockage-sessions-comptes.ts) */
  sessions: StockageSessionsComptes;
  /** Zones des fondateurs, pour la candidature (services/zones-fondateurs.ts, ou la mémoire) */
  zones: ServicesZones;
  /** Envoi des liens par mail (services/courriels/courriels-comptes.ts) */
  courriels: CourrielsComptes;
  /** Base des liens envoyés par mail (https://ambassadeur.sosmiam.fr ; l'API de démonstration met la sienne) */
  adresseEspace?: string;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

/**
 * /comptes/… : comptes de l'espace ambassadeur (ambassadeur.sosmiam.fr), appelés seulement par le serveur du site.
 * JSON ; jeton de session dans l'en-tête X-Session-Compte, IP du visiteur dans X-IP-Visiteur (elle ne sert qu'aux limites).
 * Réponses : { ok: true, … } ou { ok: false, erreur, champ?, attente? }, jamais en cache. `compte` a exactement la forme
 * de apps/site-web/src/types/compte.ts, plus `emailVerifie` (booléen : e-mail confirmé par le lien reçu). Les adresses qui calculent une empreinte de mot de passe peuvent aussi répondre
 * 503 « occupe » (avec Retry-After) quand trop de calculs attendent déjà : rien n'est fait, ni compté, on réessaie.
 *
 * POST   /comptes                       { email, motDePasse, prenom, ville, quartier?, dateNaissance, cgu: true, piege? }
 *                                        201 { ok, session, compte } (piège rempli : 201 { ok } sans session)
 *                                        400 champ-invalide {champ} · 403 age-minimum · 409 email-deja-utilise · 429
 * POST   /comptes/session               { email, motDePasse } → 201 { ok, session, compte } · 400 · 401 identifiants · 429 {attente}
 * GET    /comptes/session               → 200 { ok, compte } · 401 session-expiree
 * DELETE /comptes/session               → 200 { ok } (déconnexion)
 * PATCH  /comptes/moi                   { prenom?, ville?, quartier? } (quartier "" : effacé) → 200 { ok, compte } · 400 · 401
 * POST   /comptes/moi/mot-de-passe      { actuel, nouveau } → 200 { ok, session } (toutes les sessions fermées, un nouveau
 *                                        jeton remplace celui en cours) · 400 champ-invalide (nouveau) · 403 mot-de-passe-incorrect
 *                                        · 401 · 429 {attente}
 * DELETE /comptes/moi                   { motDePasse } → 200 { ok } (tout effacé) · 403 mot-de-passe-incorrect · 401 · 429 {attente}
 * POST   /comptes/nouveau-mot-de-passe  { jeton, motDePasse } → 200 { ok } (jeton effacé, toutes les sessions fermées)
 *                                        400 champ-invalide · 410 jeton-invalide · 429
 * POST   /comptes/mot-de-passe-oublie   { email } → toujours 200 { ok } (lien de 24 h envoyé seulement si le compte existe,
 *                                        1 toutes les 15 min et 5 par 24 h par compte) · 400 champ-invalide (email mal
 *                                        formé) · 429 (5 demandes par visiteur et par heure)
 * POST   /comptes/verifier-email        { jeton } → 200 { ok } (e-mail confirmé, jeton effacé) · 400 jeton-invalide · 429
 * POST   /comptes/moi/renvoyer-verification → 200 { ok, dejaVerifie } · 401 · 429 trop-de-demandes {attente} (1 lien toutes
 *                                        les 15 min et 5 par 24 h, l'envoi de l'inscription compris)
 * POST   /comptes/moi/suggestions       { lieuId, proposition, message? } (tout compte connecté) : proposer une modification
 *                                        d'une fiche de lieu, décidée par l'équipe dans le logiciel de gestion.
 *                                        proposition : PropositionLieu de packages/commun (nom, adresse, horaires, texte,
 *                                        telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi, enfants, parking,
 *                                        paiements, reservation), vérifiée par validerPropositionLieu ; message : « Pourquoi ? »
 *                                        (1 000 car.) → 201 { ok, id } (gardée avec seulement les champs qui changent, et
 *                                        « avant » : ces champs tels qu'ils sont dans la fiche ; source « client »)
 *                                        · 400 proposition-invalide {champ} (champ de validerPropositionLieu, ou « autre »
 *                                        pour un champ qui n'est pas proposable) · 400 rien-a-changer (tout est déjà
 *                                        comme ça) · 401 · 404 lieu-inconnu (absent ou pas publié) · 409 trop-de-suggestions
 *                                        (10 par 24 h par compte, ou déjà 3 en attente sur ce lieu) · 429 (20 par visiteur
 *                                        et par heure)
 * Ambassadeur « actif » seulement (sinon 403 ambassadeur-non-actif) :
 * GET    /comptes/moi/candidature       → 200 { ok, candidature: { statut, numero, numeroLocal, numeroNational, commune, zone,
 *                                        creeLe, reponduLe } | null, placesRestantes } (statut : en-attente, acceptee,
 *                                        refusee, souvenir ; numero = numeroLocal ; commune { code, nom, nomDepartement } ou
 *                                        null ; zone { code, type, nom, nomAvecDe, places, prises, libres } ou null ;
 *                                        placesRestantes : libres de sa zone, sinon de toute la France)
 * POST   /comptes/moi/candidature       { communeCode, pepites, envies[], reseaux?, motivation, partantRencontre, connuPar?,
 *                                        piege? } → 201 { ok } · 400 (champ communeCode : absente ou inconnue) · 409
 *                                        plus-de-place (zone complète) · 409 candidature-existante
 * POST   /comptes/moi/candidature/commune { communeCode } → 200 { ok, candidature } · 400 champ-invalide communeCode · 404
 *                                        aucune-candidature · 409 deja-traitee (plus en attente) · 409 plus-de-place
 * GET    /comptes/moi/propositions      → 200 { ok, propositions: [{ id, nom, ville, statut, creeLe }] }
 * POST   /comptes/moi/propositions      { nom, type?, ville, adresse?, description, plat?, horaires?, siteWeb?, instagram?, piege? }
 *                                        201 { ok } · 400
 * GET    /comptes/moi/certification     → 200 { ok, certifie: { depuis, profil, structure } | null, candidature: { statut,
 *                                        profil, structure, commune: { code, nom, nomDepartement } | null, envies[], creeLe,
 *                                        reponduLe } | null } (statut : en-attente, acceptee, refusee ; la dernière envoyée)
 * POST   /comptes/moi/certification     { profil, structure?, communeCode, aide, envies[], engagementGratuit: true, piege? }
 *                                        → 201 { ok } · 400 champ-invalide {champ} (profil : ambassadeur, pro ou structure ;
 *                                        structure : 100 car. ; communeCode connue ; aide : 1 à 600 car. ; envies : au moins
 *                                        une parmi fiche, photos, presenter, big-sos ; engagementGratuit : true) · 409
 *                                        deja-certifie · 409 candidature-existante (une en attente ; après un refus, on peut
 *                                        recandidater tout de suite)
 * `compte.ambassadeur.certifie` (dans toutes les réponses qui rendent `compte`) : { depuis, profil, structure } ou null.
 */
export function creerRoutesComptes(dependances: DependancesComptes, protection: ProtectionComptes, limiteConnectee: RequestHandler) {
  const { services, zones, courriels, adresseEspace = ADRESSE_ESPACE, horloge = Date.now } = dependances;
  // Deux attentes après des mots de passe faux : la connexion (par e-mail) et « Mon compte » (par id du compte) ; deux
  // limites de liens envoyés par mail (par id du compte)
  const contexte = {
    services, protection, zones, courriels, adresseEspace, horloge,
    attente: creerAttenteParCompte(horloge), attenteConnectee: creerAttenteParCompte(horloge),
    limiteOubli: creerLimiteEnvois(horloge), limiteVerification: creerLimiteEnvois(horloge),
  };
  const c = creerControleursComptes(contexte);
  const moi = creerControleursMonCompte(contexte);
  const liens = creerControleursLiens(contexte);
  const espace = creerControleursEspaceComptes(services, zones);
  const certification = creerControleursCertification(services);
  const suggestions = creerControleursSuggestions(services, horloge);
  const routes = Router();

  // Sans session : une limite par visiteur pour chaque porte d'entrée, toujours AVANT de calculer une empreinte
  routes.post("/", limiterRequetes({ fenetre: 60 * 60_000, maximum: 10 }), c.inscrire);
  routes.post("/session", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 20 }), c.connecter);
  routes.post("/nouveau-mot-de-passe", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 10 }), c.choisirNouveauMotDePasse);
  routes.post("/mot-de-passe-oublie", limiterRequetes(LIMITE_MOT_DE_PASSE_OUBLIE), liens.motDePasseOublie);
  routes.post("/verifier-email", limiterRequetes(LIMITE_VERIFIER_EMAIL), liens.verifierEmail);
  // La déconnexion passe toujours, même limite atteinte : le site efface son cookie quoi qu'il arrive, la session doit donc
  // disparaître aussi (une empreinte SHA-256 et une suppression, réponse toujours « ok » : rien à deviner ni à protéger)
  routes.delete("/session", c.deconnecter);

  routes.use(limiteConnectee);
  routes.get("/session", protection.exigerCompte, c.lireSession);
  routes.patch("/moi", protection.exigerCompte, moi.modifier);
  routes.post("/moi/mot-de-passe", protection.exigerCompte, moi.changerMotDePasse);
  routes.delete("/moi", protection.exigerCompte, moi.supprimer);
  routes.post("/moi/renvoyer-verification", protection.exigerCompte, liens.renvoyerVerification);
  routes.post("/moi/suggestions", limiterRequetes(LIMITE_SUGGESTIONS), protection.exigerCompte, suggestions.proposer);
  routes.get("/moi/candidature", protection.exigerAmbassadeurActif, espace.lireCandidature);
  routes.post("/moi/candidature", protection.exigerAmbassadeurActif, espace.candidater);
  routes.post("/moi/candidature/commune", protection.exigerAmbassadeurActif, espace.changerCommune);
  routes.get("/moi/propositions", protection.exigerAmbassadeurActif, espace.listerPropositions);
  routes.post("/moi/propositions", protection.exigerAmbassadeurActif, espace.proposer);
  routes.get("/moi/certification", protection.exigerAmbassadeurActif, certification.lire);
  routes.post("/moi/certification", protection.exigerAmbassadeurActif, certification.candidater);
  routes.use(gererErreursComptes);
  return routes;
}
