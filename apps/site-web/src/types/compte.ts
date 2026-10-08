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

/** Ce qu'un futur fondateur aimerait faire (candidature « fondateur »). */
export type EnvieFondateur = "denicher" | "fiches" | "selections" | "faire-savoir";

/** La candidature « fondateur » du compte ; une candidature refusée est effacée 3 mois après la réponse. */
export type CandidatureFondateur = {
  statut: "en-attente" | "acceptee" | "refusee";
  /** Numéro de la carte de fondateur (1 à 10), donné à l'acceptation */
  numero: number | null;
  /** Dates ISO 8601 */
  creeLe: string;
  reponduLe: string | null;
};

/** Ce qu'envoie le formulaire de candidature (les champs facultatifs vides sont absents). */
export type NouvelleCandidature = {
  pepites: string;
  envies: EnvieFondateur[];
  reseaux?: string;
  motivation: string;
  partantRencontre: boolean;
  connuPar?: string;
};

/** Un lieu proposé depuis l'espace : il arrive dans le logiciel de gestion, où l'équipe l'accepte ou le refuse. */
export type PropositionLieu = {
  id: number;
  nom: string;
  ville: string;
  statut: "a-traiter" | "acceptee" | "refusee";
  /** Date ISO 8601 */
  creeLe: string;
};

/** Une mission confiée par l'équipe (logiciel de gestion), à faire à son rythme. Dates ISO 8601. */
export type MissionAmbassadeur = {
  id: number;
  titre: string;
  detail: string;
  echeance: string | null;
  statut: "a-faire" | "faite" | "annulee";
  compteRendu: string | null;
  creeLe: string;
  faiteLe: string | null;
  lieu: { id: number; nom: string; ville: string } | null;
};

/** Un message de l'équipe, à un ambassadeur ou à tous. Le texte est brut : affiché échappé, sauts de ligne gardés. */
export type MessageAmbassadeur = {
  id: number;
  titre: string;
  texte: string;
  /** Dates ISO 8601 ; luLe vaut null tant que le message n'est pas lu */
  creeLe: string;
  luLe: string | null;
};
