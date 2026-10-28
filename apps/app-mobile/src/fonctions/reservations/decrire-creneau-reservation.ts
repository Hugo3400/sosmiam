import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { DATES_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";
import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";
import { ecrireHeureParisLangue } from "~/fonctions/langue/ecrire-heure-paris-langue";

const JOUR_MS = 86_400_000;

const lireJourUtc = (jour: string) => {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  return Date.UTC(annee, mois - 1, quantieme);
};

function nommerJour(jour: string, aujourdhui: string, langue: Langue): string {
  const T = choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue);
  const ecart = Math.round((lireJourUtc(jour) - lireJourUtc(aujourdhui)) / JOUR_MS);
  if (ecart === 0) return T.aujourdhui;
  if (ecart === 1) return T.demain;
  if (ecart === -1) return T.hier;
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const date = ecrireDateLangue({ annee, mois, jour: quantieme }, langue, { sansAnnee: jour.slice(0, 4) === aujourdhui.slice(0, 4) });
  const texte = `${CALENDRIER_PAR_LANGUE[langue].jours[lireJourSemaine(jour)]} ${date}`;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function decrireCreneauReservation(creneau: string, maintenantMs: number, langue: Langue): { court: string; lu: string } {
  const creneauMs = Date.parse(creneau);
  if (Number.isNaN(creneauMs)) return { court: "", lu: "" };
  const jour = nommerJour(calculerJourParis(creneauMs), calculerJourParis(maintenantMs), langue);
  const heure = ecrireHeureParisLangue(creneau, langue);
  return { court: `${jour} · ${heure}`, lu: choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue).aHeure(jour, heure) };
}
