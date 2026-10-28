import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { TEXTES_DEMANDE_ENVOYEE_PAR_LANGUE, TEXTES_RESERVER_TABLE_PAR_LANGUE } from "~/contenus/textes-reserver-table";
import { direDeLieuLangue } from "~/fonctions/langue/dire-de-lieu-langue";

type EtapeReserver = { titre: string; sousTitre: string };

export function decrireEtapeReserver(reservation: Reservation | null, lieu: Pick<Lieu, "nom" | "type">, automatique: boolean, langue: Langue): EtapeReserver {
  const table = choisirTextes(TEXTES_RESERVER_TABLE_PAR_LANGUE, langue);
  const envoyee = choisirTextes(TEXTES_DEMANDE_ENVOYEE_PAR_LANGUE, langue);
  const valeurs = { deLieu: direDeLieuLangue(lieu.nom, langue) };
  const remplir = (titre: string, sousTitre: string) => ({ titre, sousTitre: remplirModele(sousTitre, valeurs) });
  if (!reservation) {
    return remplir(lieu.type === "sortie" ? table.titreSortie : table.titre, automatique ? table.sousTitreAuto : table.sousTitre);
  }
  switch (reservation.statut) {
    case "demandee":
      return remplir(envoyee.titre, envoyee.sousTitre);
    case "acceptee":
    case "honoree":
      return remplir(envoyee.titreAcceptee, envoyee.sousTitreAcceptee);
    case "expiree":
      return remplir(envoyee.titreEndormie, envoyee.sousTitreEndormie);
    case "annulee":
      if (!reservation.motifRefus) {
        return remplir(reservation.reponduLe ? envoyee.titreReservationAnnulee : envoyee.titreAnnulee, envoyee.sousTitreAnnulee);
      }
      return remplir(envoyee.titreRefusee, envoyee.sousTitreRefusee);
    default:
      return remplir(envoyee.titreRefusee, envoyee.sousTitreRefusee);
  }
}
