import { calculerDecalageParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-decalage-paris.ts";
import { calculerInstantParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import type { CreneauOuverture } from "../../../../../packages/commun/src/types/lieu.ts";

export type EtatOuverture =
  | { ouvert: true; heure: string | null }
  | { ouvert: false; heure: string; quand: "aujourdhui" | "demain" | "plus-tard"; jourSemaine: number };

type Intervalle = { debut: number; fin: number };

const JOURS_REGARDES = 7;
const JOUR_MS = 24 * 60 * 60_000;

function lireMinutes(heure: string): number | null {
  const morceaux = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!morceaux) return null;
  const [heures, minutes] = [Number(morceaux[1]), Number(morceaux[2])];
  return heures > 24 || minutes > 59 || (heures === 24 && minutes > 0) ? null : heures * 60 + minutes;
}

function ecrireHeure(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function ecrireJour(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function lireParis(instantMs: number): { jour: string; semaine: number; heure: string } {
  const paris = new Date(instantMs + calculerDecalageParis(instantMs));
  return { jour: ecrireJour(paris), semaine: paris.getUTCDay(), heure: ecrireHeure(paris.getUTCHours() * 60 + paris.getUTCMinutes()) };
}

function decalerJour(jour: string, nombre: number): { jour: string; semaine: number } {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, quantieme + nombre));
  return { jour: ecrireJour(date), semaine: date.getUTCDay() };
}

function listerIntervalles(ouverture: readonly CreneauOuverture[], aujourdhui: string): Intervalle[] {
  const intervalles: Intervalle[] = [];
  for (let decalage = -1; decalage <= JOURS_REGARDES; decalage++) {
    const { jour, semaine } = decalerJour(aujourdhui, decalage);
    const lendemain = decalerJour(aujourdhui, decalage + 1).jour;
    for (const creneau of ouverture) {
      const de = lireMinutes(creneau.de);
      const a = lireMinutes(creneau.a);
      if (de === null || a === null || !Array.isArray(creneau.jours) || !creneau.jours.includes(semaine)) continue;
      const passeMinuit = a <= de || a === 24 * 60;
      const debut = calculerInstantParis(jour, ecrireHeure(de));
      const fin = calculerInstantParis(passeMinuit ? lendemain : jour, ecrireHeure(a));
      if (!Number.isNaN(debut) && !Number.isNaN(fin) && fin > debut) intervalles.push({ debut, fin });
    }
  }
  return intervalles.sort((x, y) => x.debut - y.debut);
}

function prolongerFermeture(intervalles: Intervalle[], fin: number): number {
  let fermeture = fin;
  for (const intervalle of intervalles) if (intervalle.debut <= fermeture && intervalle.fin > fermeture) fermeture = intervalle.fin;
  return fermeture;
}

export function decrireOuverture(ouverture: readonly CreneauOuverture[] | undefined, maintenant: Date): EtatOuverture | null {
  const maintenantMs = maintenant.getTime();
  if (!ouverture || ouverture.length === 0 || Number.isNaN(maintenantMs)) return null;
  const aujourdhui = lireParis(maintenantMs).jour;
  const intervalles = listerIntervalles(ouverture, aujourdhui);
  const enCours = intervalles.filter((i) => i.debut <= maintenantMs && i.fin > maintenantMs).sort((x, y) => y.fin - x.fin)[0];
  if (enCours) {
    const fermeture = prolongerFermeture(intervalles, enCours.fin);
    return { ouvert: true, heure: fermeture - maintenantMs >= JOUR_MS ? null : lireParis(fermeture).heure };
  }
  const prochain = intervalles.find((i) => i.debut > maintenantMs);
  if (!prochain) return null;
  const ouverturePrevue = lireParis(prochain.debut);
  const quand = ouverturePrevue.jour === aujourdhui
    ? "aujourdhui"
    : ouverturePrevue.jour === decalerJour(aujourdhui, 1).jour ? "demain" : "plus-tard";
  return { ouvert: false, heure: ouverturePrevue.heure, quand, jourSemaine: ouverturePrevue.semaine };
}
