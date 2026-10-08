import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserVisites } from "~/hooks/utiliser-visites";

/**
 * Tous tes points : ceux que le téléphone sait compter (rescousses, premiers sauvetages, défis réussis)
 * plus ceux des visites validées et des avis avec photo, rendus par les services.
 */
export function utiliserPointsTotaux(): number {
  const activite = utiliserActivite();
  const { points } = utiliserVisites();
  const mesures: MesuresActivite = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  return calculerPointsLocaux(mesures) + points;
}
