import { BADGES_AUTOMATIQUES } from "@sos-miam/commun/regles/badges-automatiques";
import type { IdBadge } from "@sos-miam/commun/types/badge";
import type { MesureActivite } from "~/contenus/type-mesure-activite";

type MesureBadgeDemo = { type: MesureActivite; objectif: number };

const PAR_RESCOUSSES = BADGES_AUTOMATIQUES.filter((b) => b.mesure === "rescousses" && b.filtres === null).map(
  (b): [IdBadge, MesureBadgeDemo] => [b.id, { type: "rescousses", objectif: b.objectif }],
);

/**
 * Démo seulement (bouton « Démo ») : les badges que le téléphone sait donner, et ce qu'il compte pour ça
 * (listerBadgesObtenus). Avec un compte, c'est le serveur qui les donne (compte.badges). Emoji, nom et texte : le
 * catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const MESURES_BADGES_DEMO: Partial<Record<IdBadge, MesureBadgeDemo>> = {
  ...Object.fromEntries(PAR_RESCOUSSES),
  "premier-sauveteur": { type: "premiers-sauvetages", objectif: 1 },
};
