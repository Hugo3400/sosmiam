// Suggestions de modification d'une fiche de lieu envoyées par un compte (POST /comptes/moi/suggestions) : les champs
// qu'on peut proposer, les limites, les formes échangées. Sans accès à la base : lu aussi par le double en mémoire.
// La décision se prend dans le logiciel de gestion (services/gestion/suggestions-lieux.ts).

/**
 * Les champs de PropositionLieu (packages/commun/src/types/proposition-lieu.ts), tous des colonnes de Lieu du même nom
 * (prisma/schema/lieux.prisma). Un champ envoyé hors de cette liste est refusé (400 « proposition-invalide »).
 */
export const CHAMPS_PROPOSABLES = [
  "nom", "adresse", "horaires", "texte", "telephone", "siteWeb", "instagram",
  "animaux", "accessible", "terrasse", "wifi", "enfants", "parking", "paiements", "reservation",
] as const;
export type ChampProposable = (typeof CHAMPS_PROPOSABLES)[number];

/** Par compte : 10 suggestions par 24 heures glissantes */
export const SUGGESTIONS_PAR_JOUR = 10;
/** Par compte : 3 suggestions en attente au plus sur un même lieu */
export const SUGGESTIONS_EN_ATTENTE_PAR_LIEU = 3;
export const UN_JOUR = 24 * 3600_000;

/** Les champs proposables d'une fiche, tels qu'ils sont en base (null : info inconnue) */
export type FicheSuggerable = Record<ChampProposable, string | boolean | string[] | null>;

export type NouvelleSuggestionCompte = {
  lieuId: number;
  /** Seulement les champs qui changent */
  proposition: Partial<FicheSuggerable>;
  /** Ces mêmes champs, tels qu'ils sont en base au moment de la suggestion */
  avant: Partial<FicheSuggerable>;
  message: string | null;
};

export type ResultatSuggestionCompte = { ok: true; id: number } | { ok: false; erreur: "trop-de-suggestions" };
