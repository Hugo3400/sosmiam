import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { lireHeureParis } from "@sos-miam/commun/fonctions/temps/lire-heure-paris";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { TEXTES_HORAIRES_SECOURS as T } from "~/contenus/textes-reserver-table";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { ecrireHeuresSecours } from "~/fonctions/reservations/ecrire-heures-secours";
import { lireHorairesReservation } from "~/fonctions/reservations/lire-horaires-reservation";

export function decrireHorairesSecours(reservation: Pick<Reservation, "statut" | "creneau" | "creneauxProposes" | "reponduLe">): { texte: string; lu: string } | null {
  const horaires = lireHorairesReservation(reservation);
  if (horaires.autres.length > 0) {
    const heures = ecrireHeuresSecours(horaires.autres.map((creneau) => lireHeureParis(Date.parse(creneau))));
    return { texte: remplirModele(T.ou, { heures }), lu: remplirModele(T.lu, { heures }) };
  }
  if (!horaires.planB) return null;
  const valeurs = { retenu: ecrireHeureParis(horaires.affiche), premier: ecrireHeureParis(horaires.planB.premier) };
  return { texte: remplirModele(T.planB, valeurs), lu: remplirModele(T.planBLu, valeurs) };
}
