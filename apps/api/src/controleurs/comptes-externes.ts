// « Se connecter avec Apple » et « Se connecter avec Google » (décidé le 9 octobre 2026) : le compte reste unique. Un
// « sub » déjà connu se connecte ; sinon un compte qui a le même e-mail VÉRIFIÉ reçoit ce « sub » ; sinon un compte de
// l'app est créé, avec les mêmes champs que l'inscription « app » (dès 15 ans). Aussi : comment le compte se connecte, et
// la confirmation par un nouveau jeton pour effacer un compte sans vrai mot de passe. Contrat : routes/comptes.ts.
// Jamais de jeton, d'e-mail, de « sub », de nom ni de date de naissance dans un journal.
import type { Request, Response } from "express";

import { AGE_MINIMUM_INSCRIPTION } from "../../../../packages/commun/src/regles/ages.ts";
import { calculerAgeProfil } from "../fonctions/comptes/calculer-age-profil.ts";
import { estSansMotDePasse } from "../fonctions/comptes/est-sans-mot-de-passe.ts";
import type { SupportSession } from "../fonctions/comptes/est-session-expiree.ts";
import type { FournisseurExterne, IdentiteExterne } from "../fonctions/comptes/lire-identite-externe.ts";
import { nettoyerLigne } from "../fonctions/comptes/nettoyer-ligne.ts";
import { creerEmpreinteSansMotDePasse } from "../fonctions/securite/creer-empreinte-sans-mot-de-passe.ts";
import { verifierEmail } from "../fonctions/texte/verifier-email.ts";
import { ClesIndisponibles } from "../services/cles-jwks.ts";
import type { ServicesComptesExternes } from "../services/comptes-externes-regles.ts";
import type { VerifierJetonExterne } from "../services/connexion-externe.ts";
import { PseudoDejaPris } from "../services/erreurs-comptes.ts";
import { lireCompteId, lireCorps, lireLigne } from "./comptes-champs.ts";
import { lireProfilApp, lireSupport, repondreChiffrementIndisponible, VERSION_CGU, type ContexteComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Ce que la connexion avec Apple ou Google demande : les données (comptes-externes.ts ou la mémoire) et les vérificateurs
 * de jetons (services/connexion-externe.ts) ; un vérificateur null : 503 « apple-indisponible » ou « google-indisponible » */
export type DependancesConnexionExterne = {
  services: ServicesComptesExternes;
  apple: VerifierJetonExterne | null;
  google: VerifierJetonExterne | null;
};

/** Champ du jeton dans la demande : celui que donnent les bibliothèques d'Apple (identityToken) et de Google (idToken) */
const CHAMP_JETON = { apple: "identityToken", google: "idToken" } as const satisfies Record<FournisseurExterne, string>;
const estAbsent = (valeur: unknown) => valeur === undefined || valeur === null || valeur === "";

/** Le jeton (texte non vide), sinon 400 {champ: identityToken|idToken} */
function lireJeton(corps: Record<string, unknown>, fournisseur: FournisseurExterne): string {
  const jeton = corps[CHAMP_JETON[fournisseur]];
  if (typeof jeton !== "string" || jeton === "") throw new ChampInvalide(CHAMP_JETON[fournisseur]);
  return jeton;
}

/** Le nonce brut (8 à 256 caractères visibles) : obligatoire pour Apple, facultatif pour Google ; sinon 400 {champ: nonce} */
function lireNonce(corps: Record<string, unknown>, obligatoire: boolean): string | null {
  if (!obligatoire && estAbsent(corps.nonce)) return null;
  if (typeof corps.nonce !== "string" || !/^[\x21-\x7e]{8,256}$/.test(corps.nonce)) throw new ChampInvalide("nonce");
  return corps.nonce;
}

/** Une ligne facultative pour pré-remplir « Fais connaissance » (jamais d'erreur ici) */
const lirePrefill = (valeur: unknown, maximum: number) => {
  const propre = typeof valeur === "string" ? nettoyerLigne(valeur) : "";
  return propre !== "" && propre.length <= maximum ? propre : null;
};

export function creerControleursComptesExternes(contexte: ContexteComptes) {
  const { services, protection, horloge, chiffrement, lireCompteVu, attente, externes } = contexte;
  const indisponible = (reponse: Response, fournisseur: FournisseurExterne) =>
    reponse.status(503).json({ ok: false, erreur: `${fournisseur}-indisponible` });

  /**
   * Le jeton vérifié : l'identité, ou null avec la réponse déjà partie (503 sans vérificateur ou sans clés publiques).
   * Un jeton refusé rend « invalide » (à la route de répondre).
   */
  async function verifierJeton(reponse: Response, fournisseur: FournisseurExterne, jeton: string, nonce: string | null) {
    const verifier = externes?.[fournisseur] ?? null;
    if (!verifier) return (indisponible(reponse, fournisseur), null);
    try {
      return (await verifier(jeton, nonce)) ?? ("invalide" as const);
    } catch (erreur) {
      if (!(erreur instanceof ClesIndisponibles)) throw erreur;
      console.error(`Comptes : clés publiques ${fournisseur} indisponibles`);
      reponse.set("Retry-After", "30").status(503).json({ ok: false, erreur: "verification-indisponible" });
      return null;
    }
  }

  /** 200 (connexion) ou 201 (création) avec une nouvelle session */
  async function repondreSession(reponse: Response, compteId: number, support: SupportSession, statut: 200 | 201, rattache = false) {
    const session = await protection.ouvrirSession(compteId, support);
    const compte = await lireCompteVu(compteId);
    reponse.status(statut).json({ ok: true, session, compte, nouveau: statut === 201, ...(statut === 200 ? { rattache } : {}) });
  }

  /**
   * Création d'un compte de l'app avec cette identité : mêmes champs et règles que l'inscription « app » (âge d'abord :
   * sous 15 ans, 403 et rien n'est gardé). Profil incomplet : 409 « profil-a-completer » avec de quoi pré-remplir.
   * « recommencer » : un autre envoi a créé ou lié ce compte au même moment.
   */
  async function creerAvecIdentite(reponse: Response, corps: Record<string, unknown>, identite: IdentiteExterne, support: SupportSession) {
    const { email } = identite;
    if (email === null || !identite.emailVerifie || !verifierEmail(email)) return reponse.status(400).json({ ok: false, erreur: "email-manquant" });
    const dateNaissance = typeof corps.dateNaissance === "string" && corps.dateNaissance !== "" ? corps.dateNaissance : null;
    const maintenant = new Date(horloge());
    const age = dateNaissance === null ? null : calculerAgeProfil(dateNaissance, maintenant);
    if (age !== null && age < AGE_MINIMUM_INSCRIPTION) return reponse.status(403).json({ ok: false, erreur: "age-minimum" });
    if (!chiffrement) return repondreChiffrementIndisponible(reponse);
    // Ce qui manque pour créer le compte (cgu : les conditions acceptées, comme à l'inscription ; une autre valeur que true
    // est une erreur, pas un manque)
    if (!estAbsent(corps.cgu) && corps.cgu !== true) throw new ChampInvalide("cgu");
    const manque = (["prenom", "dateNaissance", "ville", "cgu"] as const).filter((champ) => estAbsent(corps[champ]));
    if (manque.length > 0) {
      const prenom = lirePrefill(corps.prenom, 40) ?? identite.prenom;
      const nom = lirePrefill(corps.nom, 60) ?? identite.nom;
      return reponse.status(409).json({
        ok: false, erreur: "profil-a-completer", manque, prefill: { email, ...(prenom ? { prenom } : {}), ...(nom ? { nom } : {}) },
      });
    }
    if (dateNaissance === null) throw new ChampInvalide("dateNaissance");
    if (age === null) throw new ChampInvalide("dateNaissance");
    const prenom = lireLigne(corps, "prenom", 1, 40);
    const profil = lireProfilApp(corps, dateNaissance, chiffrement);
    const id = await services.creerCompte({
      email, motDePasse: creerEmpreinteSansMotDePasse(), prenom, ville: "", quartier: null, cguVersion: VERSION_CGU, espace: "app", profil,
      externe: { fournisseur: identite.fournisseur, sub: identite.sub, emailVerifieLe: maintenant },
    }).catch((erreur: unknown) => {
      if (erreur instanceof PseudoDejaPris) return "pseudo-pris" as const;
      throw erreur;
    });
    if (id === "pseudo-pris") return reponse.status(409).json({ ok: false, erreur: "pseudo-pris" });
    if (id === null) return "recommencer" as const;
    await repondreSession(reponse, id, support, 201);
  }

  /** Connexion, rattachement par l'e-mail vérifié, ou création ; « recommencer » si un envoi simultané a pris la place. */
  async function resoudre(reponse: Response, corps: Record<string, unknown>, identite: IdentiteExterne, support: SupportSession) {
    if (!externes) return indisponible(reponse, identite.fournisseur);
    const connu = await externes.services.trouverCompteParSub(identite.fournisseur, identite.sub);
    if (connu !== null) return repondreSession(reponse, connu, support, 200);
    // Même e-mail, vérifié par Apple ou Google : c'est la même personne, le compte reste unique
    const existant = identite.email !== null && identite.emailVerifie ? await services.trouverCompteParEmail(identite.email) : null;
    if (existant) {
      const resultat = await externes.services.rattacherSub(existant.id, identite.fournisseur, identite.sub, new Date(horloge()));
      if (resultat === "deja-rattache") return reponse.status(409).json({ ok: false, erreur: "compte-deja-rattache" });
      if (resultat !== "ok") return "recommencer" as const;
      // L'e-mail est prouvé : l'attente de la connexion par mot de passe repart de zéro
      attente.oublier(identite.email ?? "");
      return repondreSession(reponse, existant.id, support, 200, true);
    }
    return creerAvecIdentite(reponse, corps, identite, support);
  }

  async function connecterAvec(fournisseur: FournisseurExterne, requete: Request, reponse: Response) {
    const corps = lireCorps(requete);
    const jeton = lireJeton(corps, fournisseur);
    const nonce = lireNonce(corps, fournisseur === "apple");
    const support = lireSupport(corps, "app");
    const identite = await verifierJeton(reponse, fournisseur, jeton, nonce);
    if (identite === null) return;
    if (identite === "invalide") return reponse.status(401).json({ ok: false, erreur: "jeton-externe-invalide" });
    // Deux essais : un envoi simultané (double appui) a pu créer ou lier le compte entre la lecture et l'écriture
    for (let essai = 0; essai < 2; essai++) if ((await resoudre(reponse, corps, identite, support)) !== "recommencer") return;
    reponse.status(409).json({ ok: false, erreur: "email-deja-utilise" });
  }

  return {
    /** POST /comptes/apple : { identityToken, nonce, prenom?, nom?, dateNaissance?, ville?, envies?, pseudo?, support? } */
    connecterApple: (requete: Request, reponse: Response) => connecterAvec("apple", requete, reponse),
    /** POST /comptes/google : { idToken, nonce?, mêmes champs } */
    connecterGoogle: (requete: Request, reponse: Response) => connecterAvec("google", requete, reponse),

    /** GET /comptes/moi/connexions : { motDePasse, apple, google } (booléens ; jamais les identifiants eux-mêmes) */
    async lireConnexions(_requete: Request, reponse: Response) {
      const id = lireCompteId(reponse);
      // Sans connexion externe branchée, aucun compte n'en a : seul le mot de passe compte
      const connexions = externes
        ? await externes.services.lireConnexions(id)
        : await services.lireIdentifiants(id).then((lu) => lu && { sansMotDePasse: estSansMotDePasse(lu.motDePasse), appleSub: null, googleSub: null });
      if (!connexions) return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
      const { sansMotDePasse, appleSub, googleSub } = connexions;
      reponse.json({ ok: true, connexions: { motDePasse: !sansMotDePasse, apple: appleSub !== null, google: googleSub !== null } });
    },

    /**
     * Effacer un compte SANS vrai mot de passe (DELETE /comptes/moi) : confirmé par un NOUVEAU jeton d'Apple (identityToken
     * et nonce) ou de Google (idToken, nonce?) du même compte Apple ou Google que celui lié. Faux si la réponse est déjà
     * partie : 400 {champ: confirmation} sans jeton, 403 « confirmation-incorrecte » (jeton refusé, ou d'un autre compte),
     * 503. Un jeton signé ne se devine pas : pas d'attente par compte ici (la limite des adresses connectées suffit).
     */
    async confirmerSansMotDePasse(reponse: Response, corps: Record<string, unknown>): Promise<boolean> {
      const fournisseur: FournisseurExterne | null = !estAbsent(corps.identityToken) ? "apple" : !estAbsent(corps.idToken) ? "google" : null;
      if (!fournisseur) throw new ChampInvalide("confirmation");
      const jeton = lireJeton(corps, fournisseur);
      const nonce = lireNonce(corps, fournisseur === "apple");
      const identite = await verifierJeton(reponse, fournisseur, jeton, nonce);
      if (identite === null) return false;
      const connexions = externes && identite !== "invalide" ? await externes.services.lireConnexions(lireCompteId(reponse)) : null;
      const lie = connexions && (fournisseur === "apple" ? connexions.appleSub : connexions.googleSub);
      if (identite !== "invalide" && lie && identite.sub === lie) return true;
      reponse.status(403).json({ ok: false, erreur: "confirmation-incorrecte" });
      return false;
    },
  };
}
