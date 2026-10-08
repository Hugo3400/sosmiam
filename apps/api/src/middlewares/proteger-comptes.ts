// Protection des routes des comptes (espace ambassadeur du site, puis l'app). La personne connectée envoie son jeton de
// session dans l'en-tête X-Session-Compte (le site le garde dans un cookie HttpOnly, jamais dans une adresse) ; la base
// n'en garde que l'empreinte SHA-256. Une session se ferme après 30 jours sans visite, et au plus tard après 90 jours.
// Rien n'est gardé en mémoire : une décision de l'équipe (refus, suspension) ou une déconnexion compte tout de suite.
import type { NextFunction, Request, Response } from "express";

import { ChampInvalide } from "../controleurs/gestion/lire-champs.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import type { StatutAmbassadeur } from "../services/comptes.ts";

const UN_JOUR = 86_400_000;
const INACTIVITE_MAX = 30 * UN_JOUR;
const DUREE_MAX = 90 * UN_JOUR;
/** L'heure de dernière activité n'est réécrite dans la base qu'au plus toutes les 5 minutes */
const ECRITURE_ACTIVITE = 5 * 60_000;
/** La dernière visite du compte (effacé après 1 an sans visite) n'est réécrite qu'au plus une fois par jour */
const ECRITURE_VISITE = UN_JOUR;
/** Forme d'un jeton de creerJeton() (session, réinitialisation) : 43 caractères base64url, avec un peu de marge */
export const FORME_JETON = /^[A-Za-z0-9_-]{32,128}$/;

/** Ce que la protection met dans reponse.locals.compte pour les routes protégées */
export type CompteSession = { id: number; prenom: string; statutAmbassadeur: StatutAmbassadeur | null };

export type SessionOuverte = { compteId: number; creeLe: number; activite: number };
/** Ce que la protection doit savoir du titulaire d'une session (relu à chaque demande) */
export type TitulaireSession = { prenom: string; statutAmbassadeur: StatutAmbassadeur | null; derniereConnexion: number };

/** Où sont gardées les sessions, par l'empreinte de leur jeton (la base en vrai : services/stockage-sessions-comptes.ts). */
export type StockageSessionsComptes = {
  /** La session et son titulaire, ou null (session inconnue, ou compte effacé) */
  lire: (empreinte: string) => Promise<(SessionOuverte & TitulaireSession) | null>;
  creer: (empreinte: string, session: SessionOuverte) => Promise<void>;
  toucher: (empreinte: string, activite: number) => Promise<void>;
  /** Note la dernière visite connectée du compte (exigerCompte l'appelle au plus une fois par jour) */
  noterVisite: (compteId: number, moment: number) => Promise<void>;
  supprimer: (empreinte: string) => Promise<void>;
  /** Ferme toutes les sessions du compte, sauf peut-être une */
  supprimerDuCompte: (compteId: number, saufEmpreinte?: string) => Promise<void>;
};

/** Pour les tests et l'API de démonstration : sessions en mémoire ; `titulaires` dit qui est derrière chaque compte. */
export function creerStockageSessionsComptesEnMemoire(titulaires: Map<number, TitulaireSession> = new Map()): StockageSessionsComptes {
  const sessions = new Map<string, SessionOuverte>();
  return {
    lire: async (empreinte) => {
      const session = sessions.get(empreinte);
      const titulaire = session && titulaires.get(session.compteId);
      if (!session || !titulaire) return null;
      return { ...session, prenom: titulaire.prenom, statutAmbassadeur: titulaire.statutAmbassadeur, derniereConnexion: titulaire.derniereConnexion };
    },
    creer: async (empreinte, session) => void sessions.set(empreinte, { ...session }),
    toucher: async (empreinte, activite) => {
      const session = sessions.get(empreinte);
      if (session) session.activite = activite;
    },
    noterVisite: async (compteId, moment) => {
      const titulaire = titulaires.get(compteId);
      if (titulaire) titulaire.derniereConnexion = moment;
    },
    supprimer: async (empreinte) => void sessions.delete(empreinte),
    supprimerDuCompte: async (compteId, saufEmpreinte) => {
      for (const [empreinte, session] of sessions) if (session.compteId === compteId && empreinte !== saufEmpreinte) sessions.delete(empreinte);
    },
  };
}

/** Le jeton de session de l'en-tête X-Session-Compte, s'il en a la forme (sinon null). */
export function lireJetonSession(requete: Request): string | null {
  const jeton = requete.get("x-session-compte")?.trim() ?? "";
  return FORME_JETON.test(jeton) ? jeton : null;
}

export function creerProtectionComptes(stockage: StockageSessionsComptes, horloge: () => number = Date.now) {
  /** Routes de la personne connectée : il faut une session valable, sinon 401 « session-expiree ». */
  async function exigerCompte(requete: Request, reponse: Response, suite: NextFunction) {
    const jeton = lireJetonSession(requete);
    const empreinte = jeton ? calculerEmpreinteJeton(jeton) : null;
    const session = empreinte ? await stockage.lire(empreinte) : null;
    const maintenant = horloge();
    if (!empreinte || !session || maintenant - session.activite > INACTIVITE_MAX || maintenant - session.creeLe > DUREE_MAX) {
      if (empreinte && session) await stockage.supprimer(empreinte);
      return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
    }
    if (maintenant - session.activite > ECRITURE_ACTIVITE) await stockage.toucher(empreinte, maintenant);
    if (maintenant - session.derniereConnexion > ECRITURE_VISITE) await stockage.noterVisite(session.compteId, maintenant);
    reponse.locals.compte = { id: session.compteId, prenom: session.prenom, statutAmbassadeur: session.statutAmbassadeur } satisfies CompteSession;
    suite();
  }

  /** Candidature, propositions, kit, missions, messages : seulement pour un ambassadeur validé par l'équipe, sinon 403. */
  async function exigerAmbassadeurActif(requete: Request, reponse: Response, suite: NextFunction) {
    await exigerCompte(requete, reponse, () => {
      if ((reponse.locals.compte as CompteSession).statutAmbassadeur !== "actif") {
        return void reponse.status(403).json({ ok: false, erreur: "ambassadeur-non-actif" });
      }
      suite();
    });
  }

  /**
   * Nouvelle session (inscription, connexion, changement de mot de passe) : le jeton est rendu une seule fois, la base
   * n'en garde que l'empreinte.
   */
  async function ouvrirSession(compteId: number): Promise<string> {
    const jeton = creerJeton();
    const maintenant = horloge();
    await stockage.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: maintenant, activite: maintenant });
    return jeton;
  }

  /** Déconnexion : la session disparaît. */
  async function fermerSession(jeton: string): Promise<void> {
    await stockage.supprimer(calculerEmpreinteJeton(jeton));
  }

  /**
   * Ferme les sessions du compte : toutes (réinitialisation ; changement de mot de passe, où un nouveau jeton remplace
   * ensuite celui en cours), ou toutes sauf une.
   */
  async function fermerSessionsDuCompte(compteId: number, saufJeton?: string): Promise<void> {
    await stockage.supprimerDuCompte(compteId, saufJeton ? calculerEmpreinteJeton(saufJeton) : undefined);
  }

  return { exigerCompte, exigerAmbassadeurActif, ouvrirSession, fermerSession, fermerSessionsDuCompte };
}

export type ProtectionComptes = ReturnType<typeof creerProtectionComptes>;

/**
 * Dernier filet des routes des comptes et de l'espace ambassadeur : un champ invalide reçoit 400 ; la file des calculs
 * de mots de passe pleine (fonctions/securite/calculer-scrypt.ts), 503 « occupe » avec Retry-After ; une erreur
 * inattendue, 500 avec un message sobre. Le journal n'en garde que le nom, le code et l'endroit : jamais d'e-mail, de mot
 * de passe, de jeton ni de date de naissance.
 */
export function gererErreursComptes(erreur: unknown, requete: Request, reponse: Response, _suite: NextFunction) {
  if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
  const statut = typeof erreur === "object" && erreur !== null && "status" in erreur ? Number(erreur.status) : 500;
  if (statut >= 400 && statut < 500) return reponse.status(statut).json({ ok: false, erreur: "requete-invalide" });
  if (statut === 503) return reponse.set("Retry-After", "5").status(503).json({ ok: false, erreur: "occupe" });
  console.error(`Comptes : erreur inattendue (${requete.method} ${requete.originalUrl.split("?")[0]}) :`, resumerErreur(erreur));
  reponse.status(500).json({ ok: false, erreur: "erreur-serveur" });
}
