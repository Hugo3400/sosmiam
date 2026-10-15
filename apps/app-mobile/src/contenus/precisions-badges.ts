import type { IdBadge } from "@sos-miam/commun/types/badge";

/**
 * Ce que la grille des badges ajoute sous un badge pas encore obtenu (les autres : « possible dès maintenant »). `possible` :
 * faux quand personne ne peut encore le gagner, faute de mesure : le serveur ne le donne pas encore (BADGES_AUTOMATIQUES,
 * packages/commun/src/regles/badges-automatiques.ts, ne sait compter ni le type de plat, ni une sortie validée à plusieurs).
 * Emoji, nom et texte : le catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const PRECISIONS_BADGES: Partial<Record<IdBadge, { possible: boolean; texte: string }>> = {
  "deniche-par-toi": { possible: true, texte: "Ça se passe sur ambassadeur.sosmiam.fr : propose ton lieu chouchou !" },
  fondateur: { possible: true, texte: "Les places de fondateur se prennent sur ambassadeur.sosmiam.fr." },
  iode: { possible: false, texte: "Il arrivera quand l'app saura ce qu'il y a dans ton assiette. Les huîtres peuvent patienter !" },
  bande: { possible: false, texte: "Les sorties entre potes sont là, mais on ne compte pas encore les visites à plusieurs. Garde ta bande au chaud : il arrive bientôt !" },
};
