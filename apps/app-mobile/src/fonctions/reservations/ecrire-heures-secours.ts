import { formaterHeure } from "~/fonctions/dates/formater-heure";

export function ecrireHeuresSecours(heures: readonly string[]): string {
  const lues = heures.map(formaterHeure);
  if (lues.length <= 1) return lues.join("");
  return `${lues.slice(0, -1).join(", ")}, puis ${lues[lues.length - 1]}`;
}
