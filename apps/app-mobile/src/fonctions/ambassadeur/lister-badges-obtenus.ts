import { badges } from "~/contenus/badges";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";

/** Identifiants des badges obtenus, d'après ce que le téléphone sait mesurer. */
export function listerBadgesObtenus(mesures: MesuresActivite): string[] {
  return badges.filter((b) => b.mesure && mesures[b.mesure.type] >= b.mesure.objectif).map((b) => b.id);
}
