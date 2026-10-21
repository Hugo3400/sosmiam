import { HORAIRES_PROPOSES_MAX } from "@sos-miam/commun/regles/reglages-reservations";

export function basculerHoraireSecours(secours: readonly string[], heure: string): { secours: string[]; refuse: boolean } {
  if (secours.includes(heure)) return { secours: secours.filter((h) => h !== heure), refuse: false };
  if (secours.length >= HORAIRES_PROPOSES_MAX - 1) return { secours: [...secours], refuse: true };
  return { secours: [...secours, heure], refuse: false };
}
