import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";

import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";

export type JourDecrit = { haut: string; numero: string; mois: string; long: string };

const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const NOMS_MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const mettreMajuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);

export function decrireJourReservation(jour: string, aujourdhui: string): JourDecrit {
  const nomJour = NOMS_JOURS[lireJourSemaine(jour)];
  const [, mois, quantieme] = jour.split("-").map(Number);
  const date = `${nomJour} ${formaterDateLongue(jour).replace(/ \d+$/, "")}`;
  const proche = jour === aujourdhui ? "Aujourd'hui" : jour === decalerJour(aujourdhui, 1) ? "Demain" : null;
  return {
    haut: jour === aujourdhui ? "Auj." : (proche ?? `${nomJour.slice(0, 3)}.`),
    numero: String(quantieme),
    mois: NOMS_MOIS_COURTS[mois - 1],
    long: proche ? `${proche}, ${date}` : mettreMajuscule(date),
  };
}
