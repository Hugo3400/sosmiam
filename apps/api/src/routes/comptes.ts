import { Router, type RequestHandler } from "express";

import { creerAttenteParCompte } from "../controleurs/comptes-attente.ts";
import { creerControleursEspaceComptes } from "../controleurs/comptes-espace.ts";
import { creerControleursMonCompte } from "../controleurs/comptes-moi.ts";
import { creerControleursComptes, type ServicesComptes } from "../controleurs/comptes.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes, type StockageSessionsComptes } from "../middlewares/proteger-comptes.ts";

const DIX_MINUTES = 10 * 60_000;
/**
 * Adresses de la personne connectée (et l'espace ambassadeur) : 600 appels d'API par visiteur toutes les 10 minutes. Une
 * page en coûte plusieurs (/espace : 5 ; le kit média : 18 avec ses aperçus), et une IP peut être partagée (box, Wi-Fi).
 * Les routes qui vérifient un mot de passe gardent en plus l'attente par compte et la file des calculs.
 */
export const LIMITE_CONNECTEE = { fenetre: DIX_MINUTES, maximum: 600 };

export type DependancesComptes = {
  services: ServicesComptes;
  /** Où garder les sessions (la base en vrai : services/stockage-sessions-comptes.ts) */
  sessions: StockageSessionsComptes;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

/**
 * /comptes/… : comptes de l'espace ambassadeur (ambassadeur.sosmiam.fr), appelés seulement par le serveur du site.
 * JSON ; jeton de session dans l'en-tête X-Session-Compte, IP du visiteur dans X-IP-Visiteur (elle ne sert qu'aux limites).
 * Réponses : { ok: true, … } ou { ok: false, erreur, champ?, attente? }, jamais en cache. `compte` a exactement la forme
 * de apps/site-web/src/types/compte.ts. Les adresses qui calculent une empreinte de mot de passe peuvent aussi répondre
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
 * Ambassadeur « actif » seulement (sinon 403 ambassadeur-non-actif) :
 * GET    /comptes/moi/candidature       → 200 { ok, candidature: { statut, numero, creeLe, reponduLe } | null, placesRestantes }
 *                                        (places de fondateur encore libres : 10 moins les numéros donnés, jamais sous 0)
 * POST   /comptes/moi/candidature       { pepites, envies[], reseaux?, motivation, partantRencontre, connuPar?, piege? }
 *                                        201 { ok } · 400 · 409 candidature-existante · 409 plus-de-place (placesRestantes = 0)
 * GET    /comptes/moi/propositions      → 200 { ok, propositions: [{ id, nom, ville, statut, creeLe }] }
 * POST   /comptes/moi/propositions      { nom, type?, ville, adresse?, description, plat?, horaires?, siteWeb?, instagram?, piege? }
 *                                        201 { ok } · 400
 */
export function creerRoutesComptes({ services, horloge = Date.now }: DependancesComptes, protection: ProtectionComptes, limiteConnectee: RequestHandler) {
  // Deux attentes après des mots de passe faux : la connexion (par e-mail) et « Mon compte » (par id du compte)
  const contexte = { services, protection, attente: creerAttenteParCompte(horloge), attenteConnectee: creerAttenteParCompte(horloge), horloge };
  const c = creerControleursComptes(contexte);
  const moi = creerControleursMonCompte(contexte);
  const espace = creerControleursEspaceComptes(services);
  const routes = Router();

  // Sans session : une limite par visiteur pour chaque porte d'entrée, toujours AVANT de calculer une empreinte
  routes.post("/", limiterRequetes({ fenetre: 60 * 60_000, maximum: 10 }), c.inscrire);
  routes.post("/session", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 20 }), c.connecter);
  routes.post("/nouveau-mot-de-passe", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 10 }), c.choisirNouveauMotDePasse);
  // La déconnexion passe toujours, même limite atteinte : le site efface son cookie quoi qu'il arrive, la session doit donc
  // disparaître aussi (une empreinte SHA-256 et une suppression, réponse toujours « ok » : rien à deviner ni à protéger)
  routes.delete("/session", c.deconnecter);

  routes.use(limiteConnectee);
  routes.get("/session", protection.exigerCompte, c.lireSession);
  routes.patch("/moi", protection.exigerCompte, moi.modifier);
  routes.post("/moi/mot-de-passe", protection.exigerCompte, moi.changerMotDePasse);
  routes.delete("/moi", protection.exigerCompte, moi.supprimer);
  routes.get("/moi/candidature", protection.exigerAmbassadeurActif, espace.lireCandidature);
  routes.post("/moi/candidature", protection.exigerAmbassadeurActif, espace.candidater);
  routes.get("/moi/propositions", protection.exigerAmbassadeurActif, espace.listerPropositions);
  routes.post("/moi/propositions", protection.exigerAmbassadeurActif, espace.proposer);
  routes.use(gererErreursComptes);
  return routes;
}
