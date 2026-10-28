import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { lireHeureParis } from "@sos-miam/commun/fonctions/temps/lire-heure-paris";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { TEXTES_HORAIRES_SECOURS_PAR_LANGUE } from "~/contenus/textes-reserver-table";
import { ecrireHeureParisLangue } from "~/fonctions/langue/ecrire-heure-paris-langue";
import { ecrireHeuresSecours } from "~/fonctions/reservations/ecrire-heures-secours";
import { lireHorairesReservation } from "~/fonctions/reservations/lire-horaires-reservation";

export function decrireHorairesSecours(reservation: Pick<Reservation, "statut" | "creneau" | "creneauxProposes" | "reponduLe">, langue: Langue): { texte: string; lu: string } | null {
  const T = choisirTextes(TEXTES_HORAIRES_SECOURS_PAR_LANGUE, langue);
  const horaires = lireHorairesReservation(reservation);
  if (horaires.autres.length > 0) {
    const heures = ecrireHeuresSecours(horaires.autres.map((creneau) => lireHeureParis(Date.parse(creneau))), langue);
    return { texte: remplirModele(T.ou, { heures }), lu: remplirModele(T.lu, { heures }) };
  }
  if (!horaires.planB) return null;
  const valeurs = { retenu: ecrireHeureParisLangue(horaires.affiche, langue), premier: ecrireHeureParisLangue(horaires.planB.premier, langue) };
  return { texte: remplirModele(T.planB, valeurs), lu: remplirModele(T.planBLu, valeurs) };
}
