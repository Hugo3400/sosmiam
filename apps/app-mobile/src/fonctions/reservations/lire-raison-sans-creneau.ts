import type { JourReservation } from "~/contenus/type-jour-reservation";

export type RaisonSansCreneau = "ferme" | "trop-tard";

export function lireRaisonSansCreneau(jour: JourReservation, aujourdhui: string): RaisonSansCreneau | null {
  if (jour.creneaux.length > 0) return null;
  return jour.jour === aujourdhui && !jour.ferme ? "trop-tard" : "ferme";
}
