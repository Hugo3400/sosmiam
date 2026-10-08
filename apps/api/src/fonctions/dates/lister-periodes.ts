import { calculerClesPeriodes } from "./calculer-cles-periodes.ts";

export type Echelle = "jour" | "semaine" | "mois" | "annee";
/** Une période et ses jours extrêmes (« AAAA-MM-JJ », à l'heure de Paris) */
export type Periode = { cle: string; debut: string; fin: string };

const UN_JOUR = 86_400_000;
const enTexte = (date: Date) => date.toISOString().slice(0, 10);

/** Les `nombre` dernières périodes de l'échelle, de la plus ancienne à celle en cours (incluse). */
export function listerPeriodes(echelle: Echelle, nombre: number, maintenant: Date): Periode[] {
  const [a, m, j] = calculerClesPeriodes(maintenant).jour.split("-").map(Number) as [number, number, number];
  const periodes: Periode[] = [];
  for (let rang = nombre - 1; rang >= 0; rang--) {
    if (echelle === "jour") {
      const jour = enTexte(new Date(Date.UTC(a, m - 1, j) - rang * UN_JOUR));
      periodes.push({ cle: jour, debut: jour, fin: jour });
    } else if (echelle === "semaine") {
      const date = new Date(Date.UTC(a, m - 1, j) - rang * 7 * UN_JOUR);
      const lundi = new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * UN_JOUR);
      // Midi UTC : toujours le même jour à Paris, pour lire la clé de la semaine sans décalage
      const cle = calculerClesPeriodes(new Date(lundi.getTime() + UN_JOUR / 2)).semaine;
      periodes.push({ cle, debut: enTexte(lundi), fin: enTexte(new Date(lundi.getTime() + 6 * UN_JOUR)) });
    } else if (echelle === "mois") {
      const premier = new Date(Date.UTC(a, m - 1 - rang, 1));
      const dernier = new Date(Date.UTC(premier.getUTCFullYear(), premier.getUTCMonth() + 1, 0));
      periodes.push({ cle: enTexte(premier).slice(0, 7), debut: enTexte(premier), fin: enTexte(dernier) });
    } else {
      const annee = String(a - rang);
      periodes.push({ cle: annee, debut: `${annee}-01-01`, fin: `${annee}-12-31` });
    }
  }
  return periodes;
}
