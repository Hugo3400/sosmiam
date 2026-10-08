// Les règles de la communauté (CGU, « Les règles de la communauté ») : le motif d'un signalement retenu. À part de
// moderation.ts pour être lues sans ouvrir la base (contrôleurs, tests).
export const MOTIFS_MODERATION = [
  "fausse-info", "pub-cachee", "arnaque", "haine", "violence", "danger", "vie-privee", "droits", "triche", "usurpation", "illegal",
] as const;
export type MotifModeration = (typeof MOTIFS_MODERATION)[number];
