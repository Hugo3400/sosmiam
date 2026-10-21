import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { ANNONCES_COMPTOIR_RESERVATIONS as A } from "~/contenus/textes-comptoir-reservations";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";

export function decrireNouvellesTables(nouvelles: readonly ReservationPro[], maintenantMs: number): string | null {
  const [seule] = nouvelles;
  if (!seule) return null;
  if (nouvelles.length > 1) return remplirModele(A.nouvelles, { nombre: String(nouvelles.length) });
  const lu = decrireCreneauReservation(seule.creneau, maintenantMs).lu;
  const valeurs = { nom: nommerClientReservation(seule), personnes: ecrireNombrePersonnes(seule.personnes), quand: lu.charAt(0).toLocaleLowerCase("fr-FR") + lu.slice(1) };
  return remplirModele(seule.statut === "demandee" ? A.nouvelleDemande : A.nouvelleAuto, valeurs);
}
