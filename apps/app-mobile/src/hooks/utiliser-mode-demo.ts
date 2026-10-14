import { useState } from "react";

import { basculerModeDemo } from "~/fonctions/demo/basculer-mode-demo";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_POSSIBLE, DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

/**
 * Le bouton « Démo » : entrer dans la démo ou en sortir. Les deux mondes ne se mélangent jamais : on se déconnecte du vrai
 * compte, on efface ce que le téléphone gardait, puis l'app se relance dans l'autre mode, à la bienvenue.
 */
export function utiliserModeDemo() {
  const { connecte, fermer } = utiliserSession();
  const effacement = utiliserEffacementLocal();
  const [enCours, setEnCours] = useState(false);

  async function basculer(actif: boolean) {
    if (enCours) return;
    setEnCours(true);
    if (connecte) await fermer();
    await effacement.toutEffacer();
    basculerModeDemo(actif);
  }

  return { possible: DEMO_POSSIBLE, actif: DEMO_VISITES_ACTIVE, enCours, entrer: () => basculer(true), sortir: () => basculer(false) };
}
