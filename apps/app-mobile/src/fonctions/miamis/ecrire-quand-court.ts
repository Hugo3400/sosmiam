import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";

const JOURS_COURTS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function ecrireQuandCourt(iso: string, maintenant: Date = new Date()): string {
  const date = new Date(iso);
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  const jour = ecart === 0 ? "Aujourd'hui" : ecart === 1 ? "Demain" : ecart < 7 ? JOURS_COURTS[date.getDay()] : `${JOURS_COURTS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  return `${jour} ${ecrireHeure(date)}`;
}
