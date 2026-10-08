// Attente imposée par compte après des mots de passe faux (règle figée le 8 octobre 2026) : à partir du 5e échec
// consécutif, 1 s, puis 2 s, 4 s… jusqu'à 15 minutes avant l'essai suivant. En mémoire seulement : rien dans la base,
// aucune adresse IP. La clé est l'e-mail en minuscules, que le compte existe ou non (sinon l'attente trahirait qui est
// inscrit). C'est elle qui rend suffisants des mots de passe de 12 caractères sans règle de composition (CNIL, cas 2).
import type { Response } from "express";

import { calculerAttenteConnexion } from "../fonctions/comptes/calculer-attente-connexion.ts";

/** Des échecs vieux d'un jour sont oubliés ; jamais plus de 100 000 e-mails suivis (les plus anciens partent d'abord) */
const OUBLI = 24 * 3600_000;
const SUIVIS_MAX = 100_000;

export function creerAttenteParCompte(horloge: () => number = Date.now) {
  /** Par e-mail : échecs consécutifs et moment du dernier. Réinsérés à chaque échec : la Map reste rangée du plus ancien au plus récent. */
  const echecs = new Map<string, { nombre: number; dernier: number }>();

  function oublierLesAnciens(maintenant: number) {
    for (const [email, suivi] of echecs) {
      if (maintenant - suivi.dernier < OUBLI && echecs.size <= SUIVIS_MAX) break;
      echecs.delete(email);
    }
  }

  return {
    /** Secondes à attendre avant le prochain essai sur ce compte (0 : il peut essayer tout de suite). */
    lireAttente(email: string): number {
      const suivi = echecs.get(email);
      if (!suivi) return 0;
      const fin = suivi.dernier + calculerAttenteConnexion(suivi.nombre) * 1000;
      return Math.max(0, Math.ceil((fin - horloge()) / 1000));
    },
    /** Un mot de passe faux de plus pour ce compte. */
    noterEchec(email: string) {
      const maintenant = horloge();
      const suivi = echecs.get(email);
      const nombre = suivi && maintenant - suivi.dernier < OUBLI ? suivi.nombre + 1 : 1;
      echecs.delete(email);
      echecs.set(email, { nombre, dernier: maintenant });
      oublierLesAnciens(maintenant);
    },
    /** Bon mot de passe (ou mot de passe remplacé) : on repart de zéro. */
    oublier(email: string) {
      echecs.delete(email);
    },
  };
}

export type AttenteParCompte = ReturnType<typeof creerAttenteParCompte>;

/** Si ce compte doit encore patienter : 429 « trop-de-demandes » avec l'attente en secondes (et Retry-After), et vrai. */
export function faireAttendre(attente: AttenteParCompte, reponse: Response, email: string): boolean {
  const secondes = attente.lireAttente(email);
  if (secondes === 0) return false;
  reponse.set("Retry-After", String(secondes));
  reponse.status(429).json({ ok: false, erreur: "trop-de-demandes", attente: secondes });
  return true;
}
