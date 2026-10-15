import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";

export function ecrireIlYa(iso: string, maintenant: Date = new Date()): string {
  const minutes = Math.floor((maintenant.getTime() - Date.parse(iso)) / 60_000);
  if (Number.isNaN(minutes) || minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  return `le ${formaterDateLongue(formaterDateIso(new Date(iso))).replace(/ \d+$/, "")}`;
}
