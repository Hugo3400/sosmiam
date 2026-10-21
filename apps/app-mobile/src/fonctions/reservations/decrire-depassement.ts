import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";

import { CONFIRMATIONS_COMPTOIR_RESERVATIONS } from "~/contenus/textes-comptoir-reservations";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

const T = CONFIRMATIONS_COMPTOIR_RESERVATIONS.depasser;

export type Depassement = { nom: string; heure: string; personnes: number; places: number | null; jourFerme: boolean };

export function decrireDepassement(d: Depassement): string {
  if (d.jourFerme) return remplirModele(T.detailJourFerme, { nom: d.nom, heure: d.heure });
  if (d.places === null || d.places <= 0) return remplirModele(T.detailComplet, { nom: d.nom, heure: d.heure, personnes: ecrireNombrePersonnes(d.personnes) });
  return remplirModele(T.detailPlaces, {
    heure: d.heure,
    places: `${d.places} place${d.places > 1 ? "s" : ""}`,
    personnes: ecrireNombrePersonnes(d.personnes),
    depassement: ecrireNombrePersonnes(d.personnes - d.places),
  });
}
