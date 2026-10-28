import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { CONFIRMATIONS_COMPTOIR_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { RESUMES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-statut-reservation";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";

export type Depassement = { nom: string; heure: string; personnes: number; places: number | null; jourFerme: boolean };

export function decrireDepassement(d: Depassement, langue: Langue): string {
  const T = choisirTextes(CONFIRMATIONS_COMPTOIR_RESERVATIONS_PAR_LANGUE, langue).depasser;
  const personnes = ecrireNombrePersonnesLangue(d.personnes, langue);
  if (d.jourFerme) return remplirModele(T.detailJourFerme, { nom: d.nom, heure: d.heure });
  if (d.places === null || d.places <= 0) return remplirModele(T.detailComplet, { nom: d.nom, heure: d.heure, personnes });
  return remplirModele(T.detailPlaces, {
    heure: d.heure,
    places: choisirTextes(RESUMES_RESERVATIONS_PRO_PAR_LANGUE, langue).places(d.places),
    personnes,
    depassement: ecrireNombrePersonnesLangue(d.personnes - d.places, langue),
  });
}
