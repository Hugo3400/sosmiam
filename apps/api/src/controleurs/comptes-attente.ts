// Attente imposée par compte après des mots de passe faux (CNIL, délibération 2022-100, §43) : à partir du 5e échec
// consécutif, 2 min, puis 4 min, 8 min… jusqu'à 2 heures avant l'essai suivant, soit 21 essais au plus par 24 h. En
// mémoire seulement : rien dans la base, aucune adresse IP. Pour la connexion, la clé est l'e-mail en minuscules, que le
// compte existe ou non (sinon l'attente trahirait qui est inscrit) ; pour « Mon compte », l'id du compte (une attente à
// part, que seul le titulaire d'une session peut faire monter). C'est elle qui rend suffisants des mots de passe de 12
// caractères sans règle de composition (CNIL, cas 2).
// Chaque essai est compté AVANT de vérifier le mot de passe, sans rien attendre entre la lecture de l'attente et le
// compte (noterEchec juste après faireAttendre) : des essais lancés tous en même temps ne passent donc pas tous.
import type { Response } from "express";

import { calculerAttenteConnexion } from "../fonctions/comptes/calculer-attente-connexion.ts";

/** Des échecs vieux d'un jour sont oubliés ; jamais plus de 100 000 comptes suivis (les plus anciens partent d'abord) */
const OUBLI = 24 * 3600_000;
const SUIVIS_MAX = 100_000;

export function creerAttenteParCompte(horloge: () => number = Date.now) {
  /** Par compte : échecs consécutifs et moment du dernier. Réinsérés à chaque échec : la Map reste rangée du plus ancien au plus récent. */
  const echecs = new Map<string, { nombre: number; dernier: number }>();

  function oublierLesAnciens(maintenant: number) {
    for (const [cle, suivi] of echecs) {
      if (maintenant - suivi.dernier < OUBLI && echecs.size <= SUIVIS_MAX) break;
      echecs.delete(cle);
    }
  }
  // Ménage chaque minute, même sans nouvel échec : une adresse ne reste pas en mémoire plus d'un jour après son dernier
  // essai (la politique de confidentialité le promet). unref : ne retient pas l'arrêt du serveur.
  setInterval(() => oublierLesAnciens(horloge()), 60_000).unref();

  return {
    /** Secondes à attendre avant le prochain essai sur ce compte (0 : il peut essayer tout de suite). */
    lireAttente(cle: string): number {
      const suivi = echecs.get(cle);
      if (!suivi) return 0;
      const fin = suivi.dernier + calculerAttenteConnexion(suivi.nombre) * 1000;
      return Math.max(0, Math.ceil((fin - horloge()) / 1000));
    },
    /** Un essai de plus pour ce compte, noté AVANT de vérifier le mot de passe (oublier l'efface s'il était bon). */
    noterEchec(cle: string) {
      const maintenant = horloge();
      const suivi = echecs.get(cle);
      const nombre = suivi && maintenant - suivi.dernier < OUBLI ? suivi.nombre + 1 : 1;
      echecs.delete(cle);
      echecs.set(cle, { nombre, dernier: maintenant });
      oublierLesAnciens(maintenant);
    },
    /**
     * L'essai noté n'a pas pu avoir lieu (file des calculs pleine, panne) : il ne compte pas. Le moment du dernier essai
     * ne recule pas : une attente n'en est jamais raccourcie.
     */
    annulerEchec(cle: string) {
      const suivi = echecs.get(cle);
      if (suivi && suivi.nombre > 1) suivi.nombre -= 1;
      else echecs.delete(cle);
    },
    /** Bon mot de passe (ou mot de passe remplacé) : on repart de zéro. */
    oublier(cle: string) {
      echecs.delete(cle);
    },
    /** Nombre de comptes suivis en ce moment (de quoi vérifier que le ménage passe bien) */
    compterSuivis(): number {
      return echecs.size;
    },
  };
}

export type AttenteParCompte = ReturnType<typeof creerAttenteParCompte>;

/** Si ce compte doit encore patienter : 429 « trop-de-demandes » avec l'attente en secondes (et Retry-After), et vrai. */
export function faireAttendre(attente: AttenteParCompte, reponse: Response, cle: string): boolean {
  const secondes = attente.lireAttente(cle);
  if (secondes === 0) return false;
  reponse.set("Retry-After", String(secondes));
  reponse.status(429).json({ ok: false, erreur: "trop-de-demandes", attente: secondes });
  return true;
}

/**
 * Vérifie un mot de passe en comptant l'essai d'abord. À appeler juste après faireAttendre, sans await entre les deux :
 * l'essai est noté avant tout calcul. Un résultat (vrai, ou le compte) remet le compteur à zéro ; une erreur (file des
 * calculs pleine, panne) retire l'essai, qui n'a pas pu avoir lieu, et remonte (503 « occupe », ou 500).
 */
export async function verifierEnComptant<T extends object | boolean | null>(attente: AttenteParCompte, cle: string, verifier: () => Promise<T>): Promise<T> {
  attente.noterEchec(cle);
  let resultat: T;
  try {
    resultat = await verifier();
  } catch (erreur) {
    attente.annulerEchec(cle);
    throw erreur;
  }
  if (resultat) attente.oublier(cle);
  return resultat;
}
