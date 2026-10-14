import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { IdBadge } from "@sos-miam/commun/types/badge";
import { MESURES_BADGES_DEMO } from "~/contenus/badges-demo";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";

/** Démo : identifiants des badges obtenus, d'après ce que le téléphone sait mesurer (avec un compte : compte.badges). */
export function listerBadgesObtenus(mesures: MesuresActivite): IdBadge[] {
  return BADGES.filter((b) => {
    const mesure = MESURES_BADGES_DEMO[b.id];
    return !!mesure && mesures[mesure.type] >= mesure.objectif;
  }).map((b) => b.id);
}
