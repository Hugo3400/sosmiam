import type { ComptePro } from "~/types/pro";

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
  /** Vrai une fois l'adresse confirmée par le lien reçu à l'inscription (7 jours ; « Renvoyer le lien » dans l'espace) */
  emailVerifie: boolean;
  ambassadeur: {
    statut: StatutAmbassadeur;
    ville: string;
    quartier: string | null;
    /** Date de la dernière décision de l'équipe (ISO 8601) ; un refus retire le rôle d'ambassadeur 30 jours après (le compte reste) */
    decideLe: string | null;
    /** Titre d'« ambassadeur certifié », donné (ou retiré) par l'équipe ; null sans titre (absent : ancienne API) */
    certifie?: CertificationAmbassadeur | null;
  } | null;
  /** Les lieux tenus par le compte (espace pro) ; absent tant que l'API ne le rend pas (contrat prévu, types/pro.ts) */
  pro?: ComptePro | null;
};

/** « Tu es plutôt… » : un ambassadeur qui aime aider les lieux, un pro (resto, commerce…) ou une structure (asso, mairie…). */
export type ProfilCertifie = "ambassadeur" | "pro" | "structure";

/** Ce que l'ambassadeur certifié aimerait faire : mêmes codes que l'API (POST /comptes/moi/certification). */
export type EnvieCertification = "fiche" | "photos" | "presenter" | "big-sos";

/** Le titre d'« ambassadeur certifié » (docs/decisions.md, « Ambassadeur certifié ») : un titre à part, pas un palier. */
export type CertificationAmbassadeur = {
  /** Date ISO 8601 */
  depuis: string;
  profil: ProfilCertifie | null;
  /** « Les Gourmands du 11e » : montré avec le prénom sur les fiches des lieux aidés */
  structure: string | null;
};

/** La dernière candidature au titre d'ambassadeur certifié ; refusée, elle est effacée 3 mois après la réponse. */
export type CandidatureCertification = {
  statut: "en-attente" | "acceptee" | "refusee";
  profil: ProfilCertifie;
  structure: string | null;
  commune: { code: string; nom: string; nomDepartement: string } | null;
  envies: EnvieCertification[];
  /** Dates ISO 8601 */
  creeLe: string;
  reponduLe: string | null;
};

/** Ce qu'envoie le formulaire de candidature « ambassadeur certifié » (structure absente si vide). */
export type NouvelleCandidatureCertification = {
  profil: ProfilCertifie;
  structure?: string;
  /** Code INSEE de la commune où l'on vit */
  communeCode: string;
  /** Comment tu aides déjà les lieux (1 à 600 caractères) */
  aide: string;
  envies: EnvieCertification[];
  /** La case « jamais payé par un lieu », obligatoire */
  engagementGratuit: true;
  /** Champ piège du formulaire : rempli seulement par les robots */
  piege?: string;
};

/** Ce qu'un futur fondateur aimerait faire (candidature « fondateur »). */
export type EnvieFondateur = "denicher" | "fiches" | "selections" | "faire-savoir";

/**
 * Une zone de fondateurs : une ville de 50 000 habitants ou plus (10, 5, 3 ou 1 place), ou un département (ou une
 * collectivité d'outre-mer) pour ses communes plus petites (1 place). docs/decisions.md, « Fondateurs par ville ».
 */
export type ZoneFondateurs = {
  code: string;
  type: "ville" | "departement";
  /** « Lyon », « Rhône », « Saint-Denis (La Réunion) » */
  nom: string;
  /** « de Lyon », « du Rhône », « de La Rochelle », « des Landes » : pour « Fondateur n° 3 de Lyon » */
  nomAvecDe: string;
  places: number;
  prises: number;
  libres: number;
};

/** Une commune (code INSEE), telle que la recherche de l'API la rend. */
export type CommuneFondateurs = {
  code: string;
  nom: string;
  nomDepartement: string;
  codeDepartement: string;
  population: number;
  /** Le code postal tapé, quand la recherche s'est faite par code postal */
  codePostal?: string | null;
};

/** Ce que montre une recherche de commune : sa zone, une liste où choisir, ou un message (rien trouvé, API muette). */
export type ResultatRecherche =
  | { etat: "zone"; commune: CommuneFondateurs; zone: ZoneFondateurs }
  | { etat: "choix"; communes: CommuneFondateurs[] }
  | { etat: "message"; message: string }
  | { etat: "vide" };

/**
 * La candidature « fondateur » du compte ; une candidature refusée est effacée 3 mois après la réponse. « souvenir » :
 * le fondateur a déménagé, sa place s'est libérée, il garde son titre (et peut candidater ailleurs).
 */
export type CandidatureFondateur = {
  statut: "en-attente" | "acceptee" | "refusee" | "souvenir";
  /** Numéro dans sa ville ou son département (le même que numeroLocal), donné à l'acceptation, jamais redonné */
  numero: number | null;
  numeroLocal: number | null;
  /** Numéro en France, dans l'ordre des acceptations */
  numeroNational: number | null;
  /** null : candidature envoyée avant les fondateurs par ville (à préciser depuis l'espace) */
  commune: { code: string; nom: string; nomDepartement: string } | null;
  zone: ZoneFondateurs | null;
  /** Dates ISO 8601 */
  creeLe: string;
  reponduLe: string | null;
};

/** Ce qu'envoie le formulaire de candidature (les champs facultatifs vides sont absents). */
export type NouvelleCandidature = {
  /** Code INSEE de la commune où l'on vit : l'API en déduit la ville ou le département */
  communeCode: string;
  pepites: string;
  envies: EnvieFondateur[];
  reseaux?: string;
  motivation: string;
  partantRencontre: boolean;
  connuPar?: string;
  /** Champ piège du formulaire : rempli seulement par les robots */
  piege?: string;
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
