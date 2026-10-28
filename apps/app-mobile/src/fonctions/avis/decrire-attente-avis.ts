import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { ecrireAttenteLangue } from "~/fonctions/langue/ecrire-attente-langue";

export function decrireAttenteAvis(ouvertLe: string, maintenant: Date, langue: Langue): string {
  const ouverture = new Date(ouvertLe);
  return remplirModele(choisirTextes(TEXTES_DONNER_AVIS_PAR_LANGUE, langue).ouvertureAttente, {
    heure: formaterHeureLangue(ouverture.getHours(), ouverture.getMinutes(), langue, { espacee: true }),
    attente: ecrireAttenteLangue(ouverture.getTime() - maintenant.getTime(), langue),
  });
}
