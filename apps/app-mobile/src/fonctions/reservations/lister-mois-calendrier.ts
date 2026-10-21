import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import { lireJourSemaine } from "@sos-miam/commun/fonctions/temps/lire-jour-semaine";

export type MoisCalendrier = { cle: string; titre: string; semaines: (string | null)[][] };

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export function listerMoisCalendrier(aujourdhui: string, nombreJours: number): MoisCalendrier[] {
  const fin = decalerJour(aujourdhui, nombreJours - 1);
  const mois: MoisCalendrier[] = [];
  for (let jour = aujourdhui; jour !== "" && jour <= fin; jour = decalerJour(jour, 1)) {
    const cle = jour.slice(0, 7);
    let courant = mois.at(-1);
    if (!courant || courant.cle !== cle) {
      courant = { cle, titre: `${MOIS[Number(jour.slice(5, 7)) - 1]} ${jour.slice(0, 4)}`, semaines: [] };
      mois.push(courant);
    }
    const colonne = ((lireJourSemaine(jour) ?? 1) + 6) % 7;
    let semaine = courant.semaines.at(-1);
    if (!semaine || colonne === 0) {
      semaine = Array.from({ length: 7 }, () => null);
      courant.semaines.push(semaine);
    }
    semaine[colonne] = jour;
  }
  return mois;
}
