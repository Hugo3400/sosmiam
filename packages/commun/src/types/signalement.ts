/** Pourquoi une publication est signalée : l'app propose ces raisons, la modération (logiciel de gestion) les trie. */
export const RAISONS_SIGNALEMENT = [
  "faux-lieu",
  "pub-cachee",
  "arnaque",
  "haine",
  "choquant",
  "danger",
  "vie-privee",
  "vol-contenu",
  "autre",
] as const;

export type RaisonSignalement = (typeof RAISONS_SIGNALEMENT)[number];

/** Un signalement de publication, tel que l'app l'enverra à l'API. */
export type Signalement = {
  publicationId: string;
  lieuId: number;
  raison: RaisonSignalement;
  /** Précision choisie parmi celles proposées pour la raison (null si aucune) */
  precision: string | null;
  /** Ce que la personne a expliqué avec ses mots (peut être vide, sauf quand la raison l'exige) */
  explication: string;
  /** Date du signalement (ISO 8601) */
  date: string;
};
