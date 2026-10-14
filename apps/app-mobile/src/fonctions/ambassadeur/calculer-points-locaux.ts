import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { defisExemples } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerAvanceeDefi } from "~/fonctions/defis/calculer-avancee-defi";

/**
 * Démo : points du programme Ambassadeurs gagnés avec ce que le téléphone sait mesurer (rescousses, premiers sauvetages,
 * défis d'exemple réussis). Avec un compte, ce sont ceux du serveur (compte.points).
 */
export function calculerPointsLocaux(mesures: MesuresActivite): number {
  const defisReussis = defisExemples.filter((d) => calculerAvanceeDefi(d, mesures) >= d.objectif);
  return (
    mesures.rescousses * POINTS_AMBASSADEUR.rescousse +
    mesures["premiers-sauvetages"] * POINTS_AMBASSADEUR.premierSauveteur +
    defisReussis.reduce((total, d) => total + d.points, 0)
  );
}
