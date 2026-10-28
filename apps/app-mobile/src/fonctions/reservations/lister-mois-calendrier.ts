import { ecrireMoisLangue } from "@sos-miam/commun/fonctions/langue/ecrire-mois-langue";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import { lireJourSemaine } from "@sos-miam/commun/fonctions/temps/lire-jour-semaine";
import type { Langue } from "@sos-miam/commun/regles/langues";

export type MoisCalendrier = { cle: string; titre: string; semaines: (string | null)[][] };

function nommerMois(jour: string, langue: Langue): string {
  const nom = ecrireMoisLangue({ annee: Number(jour.slice(0, 4)), mois: Number(jour.slice(5, 7)) }, langue);
  return nom.charAt(0).toLocaleUpperCase("fr-FR") + nom.slice(1);
}

export function listerMoisCalendrier(aujourdhui: string, nombreJours: number, langue: Langue): MoisCalendrier[] {
  const fin = decalerJour(aujourdhui, nombreJours - 1);
  const mois: MoisCalendrier[] = [];
  for (let jour = aujourdhui; jour !== "" && jour <= fin; jour = decalerJour(jour, 1)) {
    const cle = jour.slice(0, 7);
    let courant = mois.at(-1);
    if (!courant || courant.cle !== cle) {
      courant = { cle, titre: nommerMois(jour, langue), semaines: [] };
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
