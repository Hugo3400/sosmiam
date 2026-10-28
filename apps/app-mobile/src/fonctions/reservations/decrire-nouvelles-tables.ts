import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { ANNONCES_COMPTOIR_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { ecrireQuandReservation } from "~/fonctions/reservations/ecrire-quand-reservation";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";

export function decrireNouvellesTables(nouvelles: readonly ReservationPro[], maintenantMs: number, langue: Langue): string | null {
  const A = choisirTextes(ANNONCES_COMPTOIR_RESERVATIONS_PAR_LANGUE, langue);
  const [seule] = nouvelles;
  if (!seule) return null;
  if (nouvelles.length > 1) return remplirModele(A.nouvelles, { nombre: String(nouvelles.length) });
  const valeurs = {
    nom: nommerClientReservation(seule),
    personnes: ecrireNombrePersonnesLangue(seule.personnes, langue),
    quand: ecrireQuandReservation(seule.creneau, maintenantMs, langue),
  };
  return remplirModele(seule.statut === "demandee" ? A.nouvelleDemande : A.nouvelleAuto, valeurs);
}
