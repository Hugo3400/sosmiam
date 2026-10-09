// Comptes de l'espace ambassadeur (puis de l'app) : inscription, connexion, session, nouveau mot de passe avec le lien
// reçu par mail. « Mon compte » : comptes-moi.ts ; candidature et propositions : comptes-espace.ts ; candidature
// « ambassadeur certifié » : comptes-certification.ts ; « Mot de passe oublié » et confirmation de l'e-mail : comptes-liens.ts.
// Contrat des adresses : routes/comptes.ts. Jamais d'e-mail, de mot de passe, de jeton ni de date de naissance dans un journal.
import type { Request, Response } from "express";

import { calculerAgeAParis } from "../fonctions/comptes/calculer-age-a-paris.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { validerMotDePasse } from "../fonctions/comptes/valider-mot-de-passe.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import { hacherMotDePasse } from "../fonctions/securite/hacher-mot-de-passe.ts";
import { verifierMotDePasse } from "../fonctions/securite/verifier-mot-de-passe.ts";
import { FORME_JETON, lireJetonSession, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import type { CandidatureCertificationBrute, NouvelleCandidatureCertification, ResultatCandidatureCertification } from "../services/certification.ts";
import type { CompteConnecte, ModificationCompte, NouveauCompte } from "../services/comptes.ts";
import type {
  CandidatureBrute, LieuCandidature, NouvelleCandidature, NouvelleProposition, PropositionVue, ResultatChangementCommune,
} from "../services/comptes-espace.ts";
import type { ServicesZones } from "../services/zones-fondateurs.ts";
import { faireAttendre, verifierEnComptant, type AttenteParCompte } from "./comptes-attente.ts";
import { creerControleursLiens, type CourrielsComptes } from "./comptes-liens.ts";
import type { LimiteEnvois } from "./comptes-limite-envois.ts";
import { estRobot, lireCompteId, lireCorps, lireEmail, lireLigne, lireLigneFacultative, lireMotDePasse } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Conditions d'utilisation acceptées à l'inscription : leur date de mise à jour (contenus/legal/cgu.ts du site, à garder en phase) */
export const VERSION_CGU = "2026-10-08";
const AGE_MINIMUM = 18;

/** Ce que les routes des comptes demandent aux données : services/comptes.ts et comptes-espace.ts (Prisma), ou la mémoire (tests). */
export type ServicesComptes = {
  /** Crée le compte et sa fiche d'ambassadeur « en-attente » ; null si l'e-mail est déjà pris */
  creerCompte: (compte: NouveauCompte) => Promise<number | null>;
  /** Pour la connexion : l'identifiant et l'empreinte du mot de passe (null si l'e-mail est inconnu) */
  trouverCompteParEmail: (email: string) => Promise<{ id: number; motDePasse: string } | null>;
  /** Le compte tel que son titulaire le voit (null s'il n'existe plus) */
  lireCompte: (id: number) => Promise<CompteConnecte | null>;
  /** E-mail et empreinte du mot de passe, pour vérifier le mot de passe actuel */
  lireIdentifiants: (id: number) => Promise<{ email: string; motDePasse: string } | null>;
  modifierCompte: (id: number, modification: ModificationCompte) => Promise<void>;
  changerMotDePasse: (id: number, empreinte: string) => Promise<void>;
  /** Efface le compte et tout ce qui lui est lié */
  effacerCompte: (id: number) => Promise<void>;
  /** Le compte qui a ce jeton de réinitialisation (par son empreinte), s'il n'a pas expiré */
  trouverCompteParJeton: (empreinteJeton: string, maintenant: Date) => Promise<{ id: number; email: string } | null>;
  /** Nouveau mot de passe, seulement si le jeton est toujours le sien et valable (il est effacé en même temps) */
  reinitialiserMotDePasse: (id: number, empreinteJeton: string, empreinte: string, maintenant: Date) => Promise<boolean>;
  /** Lien de nouveau mot de passe (24 h) : le jeton, rendu une seule fois ; la base n'en garde que l'empreinte */
  preparerReinitialisation: (compteId: number) => Promise<{ jeton: string; expireLe: Date }>;
  /** Lien de confirmation de l'e-mail (7 jours) : le jeton, rendu une seule fois ; il remplace le précédent */
  preparerVerificationEmail: (compteId: number) => Promise<{ jeton: string; expireLe: Date }>;
  /** E-mail confirmé si ce jeton (par son empreinte) est valable ; il est effacé en même temps */
  verifierEmail: (empreinteJeton: string, maintenant: Date) => Promise<boolean>;
  /** Sa dernière candidature fondateur (null s'il n'en a pas) */
  lireCandidature: (compteId: number) => Promise<CandidatureBrute | null>;
  /** Faux s'il a déjà une candidature en attente ou acceptée */
  creerCandidature: (compteId: number, candidature: NouvelleCandidature & LieuCandidature) => Promise<boolean>;
  /** Pose ou change la commune de sa dernière candidature, si elle est encore en attente */
  changerCommuneCandidature: (compteId: number, lieu: LieuCandidature) => Promise<ResultatChangementCommune>;
  listerPropositions: (compteId: number) => Promise<PropositionVue[]>;
  creerProposition: (compteId: number, proposition: NouvelleProposition) => Promise<void>;
  /** Sa dernière candidature « ambassadeur certifié » (null s'il n'en a pas) : services/certification.ts */
  lireCandidatureCertification: (compteId: number) => Promise<CandidatureCertificationBrute | null>;
  /** « deja-certifie » s'il a déjà le titre, « candidature-existante » s'il en a une en attente */
  creerCandidatureCertification: (compteId: number, candidature: NouvelleCandidatureCertification) => Promise<ResultatCandidatureCertification>;
};

/**
 * Ce que partagent les contrôleurs des comptes. Deux attentes après des mots de passe faux : `attente` pour la connexion
 * (clé : l'e-mail), `attenteConnectee` pour « Mon compte » (clé : l'id du compte, que seul le titulaire d'une session peut
 * faire monter : quelqu'un qui connaît seulement l'e-mail ne bloque pas le changement de mot de passe).
 */
export type ContexteComptes = {
  services: ServicesComptes; protection: ProtectionComptes; attente: AttenteParCompte; attenteConnectee: AttenteParCompte; horloge: () => number;
  /** Zones des fondateurs (candidature) */
  zones: ServicesZones;
  /** Envoi des liens par mail, et adresse de l'espace qui sert de base aux liens */
  courriels: CourrielsComptes; adresseEspace: string;
  /** Liens envoyés par compte : « Mot de passe oublié », et confirmation de l'e-mail */
  limiteOubli: LimiteEnvois; limiteVerification: LimiteEnvois;
};

export function creerControleursComptes(contexte: ContexteComptes) {
  const { services, protection, attente, attenteConnectee, horloge } = contexte;
  const { envoyerVerification } = creerControleursLiens(contexte);
  // Empreinte d'un mot de passe que personne n'a : vérifier un e-mail inconnu prend autant de temps qu'un vrai compte.
  // Calculée dès le démarrage (le .catch évite un arrêt du serveur pour une promesse rejetée que personne n'attend encore)
  const empreinteFactice = hacherMotDePasse(creerJeton());
  empreinteFactice.catch(() => {});

  /** Le compte si le mot de passe est le bon, sinon null (e-mail inconnu : le même calcul, avec l'empreinte factice). */
  async function verifierIdentifiants(email: string, motDePasse: string) {
    const compte = await services.trouverCompteParEmail(email);
    const bon = await verifierMotDePasse(motDePasse, compte?.motDePasse ?? (await empreinteFactice));
    return compte && bon ? compte : null;
  }

  /** 201 avec une nouvelle session : le jeton n'est rendu qu'une fois, le site le garde dans son cookie. */
  async function ouvrirSessionEtRepondre(reponse: Response, compteId: number) {
    const session = await protection.ouvrirSession(compteId);
    reponse.status(201).json({ ok: true, session, compte: await services.lireCompte(compteId) });
  }
  const jetonInvalide = (reponse: Response) => reponse.status(410).json({ ok: false, erreur: "jeton-invalide" });

  return {
    /** POST /comptes : le compte, sa fiche d'ambassadeur « en-attente » (l'équipe valide), et une session ouverte. */
    async inscrire(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      // L'âge d'abord : avant 18 ans, inutile de corriger le reste. La date ne sert qu'à ce calcul (ni gardée, ni écrite).
      const age = typeof corps.dateNaissance === "string" ? calculerAgeAParis(corps.dateNaissance, new Date(horloge())) : null;
      if (age !== null && age < AGE_MINIMUM) return reponse.status(403).json({ ok: false, erreur: "age-minimum" });
      const prenom = lireLigne(corps, "prenom", 1, 40);
      const email = lireEmail(corps);
      const motDePasse = lireMotDePasse(corps, "motDePasse");
      if (!validerMotDePasse(motDePasse, email)) throw new ChampInvalide("motDePasse");
      if (age === null) throw new ChampInvalide("dateNaissance");
      const ville = lireLigne(corps, "ville", 2, 80);
      const quartier = lireLigneFacultative(corps, "quartier", 80);
      if (corps.cgu !== true) throw new ChampInvalide("cgu");
      const empreinte = await hacherMotDePasse(motDePasse);
      const id = await services.creerCompte({ email, motDePasse: empreinte, prenom, ville, quartier, cguVersion: VERSION_CGU });
      // Impossible à cacher sans envoyer de mail ; la limite d'essais par visiteur freine qui voudrait s'en servir
      if (id === null) return reponse.status(409).json({ ok: false, erreur: "email-deja-utilise" });
      // Le lien de confirmation de l'e-mail : préparé ici, envoyé sans attendre ; un raté n'empêche pas l'inscription
      // (la personne peut le redemander depuis son espace)
      await envoyerVerification(id).catch((erreur: unknown) => console.error("Comptes : lien de confirmation impossible :", resumerErreur(erreur)));
      await ouvrirSessionEtRepondre(reponse, id);
    },

    /** POST /comptes/session : connexion. La même erreur « identifiants » pour un e-mail inconnu ou un mot de passe faux. */
    async connecter(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const email = lireEmail(corps);
      const motDePasse = lireMotDePasse(corps, "motDePasse");
      if (!motDePasse) throw new ChampInvalide("motDePasse");
      // L'essai est compté avant de vérifier (des essais lancés tous en même temps ne passent pas tous) ; un succès l'efface
      if (faireAttendre(attente, reponse, email)) return;
      const compte = await verifierEnComptant(attente, email, () => verifierIdentifiants(email, motDePasse));
      if (!compte) return reponse.status(401).json({ ok: false, erreur: "identifiants" });
      await ouvrirSessionEtRepondre(reponse, compte.id);
    },

    /** GET /comptes/session (après exigerCompte) : le compte de la personne connectée. */
    async lireSession(_requete: Request, reponse: Response) {
      const compte = await services.lireCompte(lireCompteId(reponse));
      if (!compte) return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
      reponse.json({ ok: true, compte });
    },

    /** DELETE /comptes/session : déconnexion (toujours « ok », même si la session n'existait déjà plus). */
    async deconnecter(requete: Request, reponse: Response) {
      const jeton = lireJetonSession(requete);
      if (jeton) await protection.fermerSession(jeton);
      reponse.json({ ok: true });
    },

    /**
     * POST /comptes/nouveau-mot-de-passe : nouveau mot de passe avec le lien reçu par mail (24 h, usage unique),
     * préparé par l'équipe ou demandé (« Mot de passe oublié »). Le jeton est effacé et toutes les sessions du compte
     * sont fermées.
     */
    async choisirNouveauMotDePasse(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const jeton = typeof corps.jeton === "string" ? corps.jeton.trim() : "";
      if (!FORME_JETON.test(jeton)) return jetonInvalide(reponse);
      const empreinteJeton = calculerEmpreinteJeton(jeton);
      const compte = await services.trouverCompteParJeton(empreinteJeton, new Date(horloge()));
      if (!compte) return jetonInvalide(reponse);
      const motDePasse = lireMotDePasse(corps, "motDePasse");
      if (!validerMotDePasse(motDePasse, compte.email)) throw new ChampInvalide("motDePasse");
      const empreinte = await hacherMotDePasse(motDePasse);
      if (!(await services.reinitialiserMotDePasse(compte.id, empreinteJeton, empreinte, new Date(horloge())))) return jetonInvalide(reponse);
      await protection.fermerSessionsDuCompte(compte.id);
      attente.oublier(compte.email);
      attenteConnectee.oublier(String(compte.id));
      reponse.json({ ok: true });
    },
  };
}
