import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { EXPIRATION_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_COMPTOIR_RESERVATIONS as T } from "~/contenus/textes-comptoir-reservations";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";

export function decrireEndormissementDemande(reservation: Pick<ReservationPro, "creneau" | "limiteReponse">, maintenantMs: number): string {
  const limite = reservation.limiteReponse ?? new Date(Date.parse(reservation.creneau) - EXPIRATION_AVANT_CRENEAU_MS).toISOString();
  const limiteMs = Date.parse(limite);
  if (Number.isNaN(limiteMs)) return "";
  if (calculerJourParis(limiteMs) === calculerJourParis(maintenantMs)) return remplirModele(T.endormissement, { heure: ecrireHeureParis(limite) });
  const quand = decrireCreneauReservation(limite, maintenantMs).lu;
  return remplirModele(T.endormissementJour, { quand: quand.charAt(0).toLocaleLowerCase("fr-FR") + quand.slice(1) });
}
