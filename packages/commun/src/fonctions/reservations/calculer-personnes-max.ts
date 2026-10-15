import { PERSONNES_RESERVATION_MAX, PERSONNES_RESERVATION_MIN } from "../../regles/reservations.ts";
import type { ReglagesServicesReservations } from "../../types/reglages-reservations.ts";

export function calculerPersonnesMax(reglages: Pick<ReglagesServicesReservations, "services"> | null): number {
  const services = reglages?.services ?? [];
  if (services.length === 0) return PERSONNES_RESERVATION_MAX;
  const plusGrand = Math.max(...services.map((s) => Math.min(s.couvertsParCreneau, s.couvertsParService)));
  return Math.max(PERSONNES_RESERVATION_MIN, Math.min(PERSONNES_RESERVATION_MAX, plusGrand));
}
