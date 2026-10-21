import type { NomServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import { MOMENTS_CRENEAUX } from "~/contenus/textes-reserver-table";

export function ecrireNomService(nom: NomServiceReservation): { emoji: string; titre: string } {
  const { emoji, libelle } = MOMENTS_CRENEAUX[nom.moment];
  if (nom.rang === null) return { emoji, titre: libelle };
  return { emoji, titre: `${libelle}, ${nom.rang === 1 ? "1er" : `${nom.rang}e`} service` };
}
