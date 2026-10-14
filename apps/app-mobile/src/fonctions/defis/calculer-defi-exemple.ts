import { calculerEtatDefi } from "@sos-miam/commun/fonctions/defis/calculer-etat-defi";
import type { DefiExemple } from "~/contenus/defis-exemples";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerAvanceeDefi } from "~/fonctions/defis/calculer-avancee-defi";

/** Ce qu'attend un défi d'exemple que le téléphone ne sait pas compter */
const ATTENTE_DEMO = "Dans la démo, celui-ci ne bouge pas : il se joue pour de vrai avec un compte.";

/**
 * Démo : un défi d'exemple tel que le profil le montre, avec l'avancée comptée sur le téléphone et son état le jour
 * `jourParis` (« AAAA-MM-JJ », calculerJourParis), comme le ferait le serveur. Sans mesure suivie : « en attente ».
 */
export function calculerDefiExemple(defi: DefiExemple, mesures: MesuresActivite, jourParis: string): DefiAffiche {
  const { mesure, ...reste } = defi;
  const fait = calculerAvanceeDefi(defi, mesures);
  const reussi = fait >= defi.objectif;
  return {
    ...reste,
    fait,
    etat: calculerEtatDefi(defi, reussi, jourParis),
    reussiLe: null,
    attente: mesure || reussi ? null : ATTENTE_DEMO,
  };
}
