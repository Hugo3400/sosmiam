import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { DATES_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";
import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";

export type JourDecrit = { haut: string; numero: string; mois: string; long: string };

const mettreMajuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);

export function decrireJourReservation(jour: string, aujourdhui: string, langue: Langue): JourDecrit {
  const T = choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue);
  const calendrier = CALENDRIER_PAR_LANGUE[langue];
  const semaine = lireJourSemaine(jour);
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const date = `${calendrier.jours[semaine]} ${ecrireDateLangue({ annee, mois, jour: quantieme }, langue, { sansAnnee: true })}`;
  const proche = jour === aujourdhui ? T.aujourdhui : jour === decalerJour(aujourdhui, 1) ? T.demain : null;
  return {
    haut: jour === aujourdhui ? T.aujourdhuiCourt : (proche ?? calendrier.joursCourts[semaine]),
    numero: String(quantieme),
    mois: calendrier.moisCourts[mois - 1],
    long: proche ? T.proche(proche, date) : mettreMajuscule(date),
  };
}
