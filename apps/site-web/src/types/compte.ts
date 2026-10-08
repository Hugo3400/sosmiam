/** Statut dans l'espace ambassadeur : l'équipe valide chaque inscription (docs/decisions.md). */
export type StatutAmbassadeur = "en-attente" | "actif" | "refuse" | "suspendu";

/** Paliers du programme Ambassadeurs ; « ambassadeur-ville » ne se gagne pas aux points. */
export type PalierCompte = "curieux" | "denicheur" | "ambassadeur-quartier" | "ambassadeur-ville";

/** Le compte tel que l'API le renvoie à la personne connectée : jamais le mot de passe ni la note de l'équipe. */
export type CompteConnecte = {
  prenom: string;
  email: string;
  points: number;
  palier: PalierCompte;
  /** Codes des badges obtenus : « premier-sauveteur », « deniche-par-toi », « fondateur »… */
  badges: string[];
  /** Date de création (ISO 8601) */
  creeLe: string;
  ambassadeur: {
    statut: StatutAmbassadeur;
    ville: string;
    quartier: string | null;
    /** Date de la dernière décision de l'équipe (ISO 8601) ; un compte refusé est effacé 30 jours après */
    decideLe: string | null;
  } | null;
};
