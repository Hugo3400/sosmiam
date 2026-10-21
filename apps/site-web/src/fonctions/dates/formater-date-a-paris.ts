import { formaterJourEnLettres } from "./formater-jour-en-lettres.ts";

const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

export function formaterDateAParis(moment: string): string | null {
  const date = new Date(moment);
  if (Number.isNaN(date.getTime())) return null;
  return formaterJourEnLettres(JOUR_PARIS.format(date));
}
