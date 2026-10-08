import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { defisExemples } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerAvanceeDefi } from "~/fonctions/ambassadeur/calculer-avancee-defi";

/**
 * Points du programme Ambassadeurs gagnés avec ce que le téléphone sait mesurer : rescousses, premiers sauvetages,
 * défis réussis. Les visites validées, avis et fiches corrigées s'y ajouteront avec l'API.
 */
export function calculerPointsLocaux(mesures: MesuresActivite): number {
  const defisReussis = defisExemples.filter((d) => calculerAvanceeDefi(d, mesures) >= d.objectif);
  return (
    mesures.rescousses * POINTS_AMBASSADEUR.rescousse +
    mesures["premiers-sauvetages"] * POINTS_AMBASSADEUR.premierSauveteur +
    defisReussis.reduce((total, d) => total + d.points, 0)
  );
}
