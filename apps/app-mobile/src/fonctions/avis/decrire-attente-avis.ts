import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";

import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";
import { ecrireHeureEspacee } from "~/fonctions/dates/ecrire-heure-espacee";

export function decrireAttenteAvis(ouvertLe: string, maintenant: Date): string {
  const ouverture = new Date(ouvertLe);
  return remplirModele(TEXTES_DONNER_AVIS.ouvertureAttente, {
    heure: ecrireHeureEspacee(ouverture),
    attente: ecrireAttente(ouverture.getTime() - maintenant.getTime()),
  });
}
