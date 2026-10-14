import type { IdBadge } from "@sos-miam/commun/types/badge";

/**
 * Ce que la grille des badges ajoute sous un badge pas encore obtenu (les autres : « possible dès maintenant »). `possible` :
 * faux quand personne ne peut encore le gagner, faute de mesure (type de plat, sorties entre potes). Emoji, nom et texte :
 * le catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const PRECISIONS_BADGES: Partial<Record<IdBadge, { possible: boolean; texte: string }>> = {
  "deniche-par-toi": { possible: true, texte: "Ça se passe sur ambassadeur.sosmiam.fr : propose ton lieu chouchou !" },
  fondateur: { possible: true, texte: "Les places de fondateur se prennent sur ambassadeur.sosmiam.fr." },
  iode: { possible: false, texte: "Il arrivera quand l'app saura ce qu'il y a dans ton assiette. Les huîtres peuvent patienter !" },
  bande: { possible: false, texte: "Il arrivera avec les sorties entre potes, bientôt dans l'app." },
};
