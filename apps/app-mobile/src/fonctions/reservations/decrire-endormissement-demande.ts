import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { EXPIRATION_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { ecrireHeureParisLangue } from "~/fonctions/langue/ecrire-heure-paris-langue";
import { ecrireQuandReservation } from "~/fonctions/reservations/ecrire-quand-reservation";

export function decrireEndormissementDemande(reservation: Pick<ReservationPro, "creneau" | "limiteReponse">, maintenantMs: number, langue: Langue): string {
  const T = choisirTextes(TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE, langue);
  const limite = reservation.limiteReponse ?? new Date(Date.parse(reservation.creneau) - EXPIRATION_AVANT_CRENEAU_MS).toISOString();
  const limiteMs = Date.parse(limite);
  if (Number.isNaN(limiteMs)) return "";
  if (calculerJourParis(limiteMs) === calculerJourParis(maintenantMs)) return remplirModele(T.endormissement, { heure: ecrireHeureParisLangue(limite, langue) });
  return remplirModele(T.endormissementJour, { quand: ecrireQuandReservation(limite, maintenantMs, langue) });
}
