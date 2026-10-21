import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { PropositionReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_COMPTOIR_RESERVATIONS as T } from "~/contenus/textes-comptoir-reservations";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

export type HoraireProposeDecrit = { creneau: string; heure: string; rang: string; places: string | null; tient: boolean; lu: string };

export function decrireHorairePropose(proposition: PropositionReservationPro, rang: number, personnes: number): HoraireProposeDecrit {
  const heure = ecrireHeureParis(proposition.creneau);
  const manque = proposition.places !== null && proposition.places < personnes;
  const tient = !proposition.jourFerme && !manque;
  const complet = remplirModele(T.complet, { personnes: ecrireNombrePersonnes(personnes) });
  const reste = (n: number) => remplirModele(n === 1 ? T.restePlaces.un : T.restePlaces.plusieurs, { nombre: String(n) });
  const morceaux = [
    ...(proposition.jourFerme ? [T.jourFerme] : []),
    ...(proposition.horsReglages ? [T.horsReglages] : []),
    ...(proposition.places === null ? [] : [manque ? complet : reste(proposition.places)]),
  ];
  const places = morceaux.length > 0 ? morceaux.join(", ") : null;
  const rangTexte = rang === 0 ? T.premierChoix : T.planB;
  return { creneau: proposition.creneau, heure, rang: rangTexte, places, tient, lu: [heure, rangTexte, ...(places ? [places] : [])].join(", ") };
}
