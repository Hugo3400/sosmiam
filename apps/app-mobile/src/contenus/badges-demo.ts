import type { IdBadge } from "@sos-miam/commun/types/badge";
import type { MesureActivite } from "~/contenus/type-mesure-activite";

/**
 * Démo seulement (bouton « Démo ») : les badges que le téléphone sait donner, et ce qu'il compte pour ça
 * (listerBadgesObtenus). Avec un compte, c'est le serveur qui les donne (compte.badges). Emoji, nom et texte : le
 * catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const MESURES_BADGES_DEMO: Partial<Record<IdBadge, { type: MesureActivite; objectif: number }>> = {
  "premiere-rescousse": { type: "rescousses", objectif: 1 },
  "premier-sauveteur": { type: "premiers-sauvetages", objectif: 1 },
};
