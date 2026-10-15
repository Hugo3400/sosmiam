import { creerMesReservationsExemples } from "~/contenus/mes-reservations-exemples";

import type { MagasinDemo } from "./types-demo";

export function ajouterMesReservationsDemo(m: MagasinDemo, maintenantMs: number): void {
  for (const exemple of creerMesReservationsExemples(maintenantMs)) {
    m.reservations.push({ ...exemple, id: m.prochainId, client: "moi" });
    m.prochainId += 1;
  }
}
