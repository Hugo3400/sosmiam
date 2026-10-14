import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

/**
 * Tous tes points. Avec un compte : ceux du serveur (rescousses, premier sauveteur, visites, avis… tout y est déjà compté ;
 * 0 tant que le compte n'est pas relu). En démo : ceux que le téléphone sait compter (rescousses, premiers sauvetages, défis
 * réussis) plus ceux des visites validées et des avis avec photo, rendus par les services de la démo.
 */
export function utiliserPointsTotaux(): number {
  const activite = utiliserActivite();
  const { points } = utiliserVisites();
  const { compte } = utiliserSession();
  if (!DEMO_VISITES_ACTIVE) return compte?.points ?? 0;
  const mesures: MesuresActivite = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  return calculerPointsLocaux(mesures) + points;
}
