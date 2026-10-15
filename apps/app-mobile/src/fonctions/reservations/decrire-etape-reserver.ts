import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { TEXTES_DEMANDE_ENVOYEE, TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

type EtapeReserver = { titre: string; sousTitre: string };

export function decrireEtapeReserver(reservation: Reservation | null, lieu: Pick<Lieu, "nom" | "type">): EtapeReserver {
  const valeurs = { deLieu: direDeLieu(lieu.nom) };
  const remplir = (titre: string, sousTitre: string) => ({ titre, sousTitre: remplirModele(sousTitre, valeurs) });
  if (!reservation) return remplir(lieu.type === "sortie" ? TEXTES_RESERVER_TABLE.titreSortie : TEXTES_RESERVER_TABLE.titre, TEXTES_RESERVER_TABLE.sousTitre);
  switch (reservation.statut) {
    case "demandee":
      return remplir(TEXTES_DEMANDE_ENVOYEE.titre, TEXTES_DEMANDE_ENVOYEE.sousTitre);
    case "acceptee":
    case "honoree":
      return remplir(TEXTES_DEMANDE_ENVOYEE.titreAcceptee, TEXTES_DEMANDE_ENVOYEE.sousTitreAcceptee);
    case "expiree":
      return remplir(TEXTES_DEMANDE_ENVOYEE.titreEndormie, TEXTES_DEMANDE_ENVOYEE.sousTitreEndormie);
    case "annulee":
      if (!reservation.motifRefus) {
        return remplir(reservation.reponduLe ? TEXTES_DEMANDE_ENVOYEE.titreReservationAnnulee : TEXTES_DEMANDE_ENVOYEE.titreAnnulee, TEXTES_DEMANDE_ENVOYEE.sousTitreAnnulee);
      }
      return remplir(TEXTES_DEMANDE_ENVOYEE.titreRefusee, TEXTES_DEMANDE_ENVOYEE.sousTitreRefusee);
    default:
      return remplir(TEXTES_DEMANDE_ENVOYEE.titreRefusee, TEXTES_DEMANDE_ENVOYEE.sousTitreRefusee);
  }
}
