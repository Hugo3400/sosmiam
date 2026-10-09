import type { StatistiquesSemaine } from "../../../../../packages/commun/src/types/statistiques-lieu.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";
import type { Periode } from "../dates/lister-periodes.ts";

/** Ce que la base rend pour un lieu, brut (services/statistiques-lieu-regles.ts) */
export type DonneesStatistiques = {
  vues: { jour: string; nombre: number }[];
  rescousses: { semaine: string; nombre: number }[];
  validations: Date[];
  premieresValidations: Date[];
};

/** La semaine (« 2026-S41 ») d'un jour de Paris « AAAA-MM-JJ » : à midi UTC, c'est toujours le même jour à Paris */
const semaineDuJour = (jour: string) => calculerClesPeriodes(new Date(`${jour}T12:00:00Z`)).semaine;

/**
 * Range les chiffres d'un lieu dans ses semaines de Paris (lundi → dimanche) : `periodes` de la plus ancienne à celle en cours
 * (listerPeriodes), rendues de la plus récente à la plus ancienne. Ce qui tombe hors de ces semaines est ignoré.
 */
export function calculerStatistiquesSemaines(periodes: Periode[], donnees: DonneesStatistiques): StatistiquesSemaine[] {
  const semaines = new Map<string, StatistiquesSemaine>(
    periodes.map((p) => [p.cle, { semaine: p.cle, debut: p.debut, vues: 0, rescousses: 0, visitesValidees: 0, nouveauxClients: 0 }]),
  );
  const ajouter = (cle: string, champ: "vues" | "rescousses" | "visitesValidees" | "nouveauxClients", nombre: number) => {
    const semaine = semaines.get(cle);
    if (semaine) semaine[champ] += nombre;
  };
  for (const v of donnees.vues) ajouter(semaineDuJour(v.jour), "vues", v.nombre);
  for (const r of donnees.rescousses) ajouter(r.semaine, "rescousses", r.nombre);
  for (const moment of donnees.validations) ajouter(calculerClesPeriodes(moment).semaine, "visitesValidees", 1);
  for (const moment of donnees.premieresValidations) ajouter(calculerClesPeriodes(moment).semaine, "nouveauxClients", 1);
  return [...semaines.values()].reverse();
}
