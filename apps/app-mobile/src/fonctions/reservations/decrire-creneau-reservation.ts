import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";

import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";

const JOUR_MS = 86_400_000;
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const lireJourUtc = (jour: string) => {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  return Date.UTC(annee, mois - 1, quantieme);
};

function nommerJour(jour: string, aujourdhui: string): string {
  const ecart = Math.round((lireJourUtc(jour) - lireJourUtc(aujourdhui)) / JOUR_MS);
  if (ecart === 0) return "Aujourd'hui";
  if (ecart === 1) return "Demain";
  if (ecart === -1) return "Hier";
  const longue = formaterDateLongue(jour);
  const texte = `${JOURS[lireJourSemaine(jour)]} ${jour.slice(0, 4) === aujourdhui.slice(0, 4) ? longue.replace(/ \d+$/, "") : longue}`;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function decrireCreneauReservation(creneau: string, maintenantMs: number): { court: string; lu: string } {
  const creneauMs = Date.parse(creneau);
  if (Number.isNaN(creneauMs)) return { court: "", lu: "" };
  const jour = nommerJour(calculerJourParis(creneauMs), calculerJourParis(maintenantMs));
  const heure = ecrireHeureParis(creneau);
  return { court: `${jour} · ${heure}`, lu: `${jour} à ${heure}` };
}
