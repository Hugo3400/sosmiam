import { MOIS_ENTRE_DEUX_CHANGEMENTS_GENRE } from "../../regles/genre.ts";

export function calculerProchainChangementGenre(modifieLe: string | null): string | null {
  if (!modifieLe) return null;
  const date = new Date(modifieLe);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + MOIS_ENTRE_DEUX_CHANGEMENTS_GENRE);
  return date.toISOString();
}
