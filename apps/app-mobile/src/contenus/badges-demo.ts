import type { IdBadge } from "@sos-miam/commun/types/badge";
import type { MesureActivite } from "~/contenus/type-mesure-activite";

/**
 * Démo seulement (bouton « Démo ») : les badges que le téléphone sait donner, et ce qu'il compte pour ça
 * (listerBadgesObtenus). Avec un compte, c'est le serveur qui les donne (compte.badges). Emoji, nom et texte : le
 * catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const MESURES_BADGES_DEMO: Partial<Record<IdBadge, { type: MesureActivite; objectif: number }>> = {
  "premiere-rescousse": { type: "rescousses", objectif: 1 },
  "sauveteur-en-serie": { type: "rescousses", objectif: 10 },
  "second-du-capitaine": { type: "rescousses", objectif: 25 },
  "heros-de-la-brigade": { type: "rescousses", objectif: 50 },
  "premier-sauveteur": { type: "premiers-sauvetages", objectif: 1 },
};
