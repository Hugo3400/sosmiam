import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

const JOUR_MS = 86_400_000;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

function nommerJour(creneau: Date, maintenant: Date): string {
  const ecart = Math.round((debutDuJour(creneau) - debutDuJour(maintenant)) / JOUR_MS);
  if (ecart === 0) return "Aujourd'hui";
  if (ecart === 1) return "Demain";
  if (ecart === -1) return "Hier";
  return ecrireJourLong(creneau, maintenant);
}

export function decrireCreneauReservation(creneau: string, maintenantMs: number): { court: string; lu: string } {
  const date = new Date(creneau);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const jour = nommerJour(date, new Date(maintenantMs));
  const heure = ecrireHeure(date);
  return { court: `${jour} · ${heure}`, lu: `${jour} à ${heure}` };
}
