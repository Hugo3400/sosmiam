import type { Visite } from "@sos-miam/commun/types/visite";

/** Un mois de « Mes visites » : « 2026-10 », son titre (« Octobre 2026 ») et ses visites, de la plus récente à la plus ancienne */
export type MoisVisites = { mois: string; titre: string; visites: Visite[] };

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** Le moment qui compte : la validation (le passage à la caisse), sinon la demande */
const dateDe = (visite: Visite) => visite.valideLe ?? visite.creeLe;

/**
 * Range les visites par mois, à l'heure du téléphone : le mois le plus récent d'abord, et dans chaque mois la visite la
 * plus récente d'abord. Une visite à la date illisible (ça ne devrait pas arriver) est mise de côté dans « Sans date », à la fin.
 */
export function grouperVisitesParMois(visites: readonly Visite[]): MoisVisites[] {
  const triees = [...visites].sort((a, b) => (Date.parse(dateDe(b)) || 0) - (Date.parse(dateDe(a)) || 0));
  const groupes: MoisVisites[] = [];
  for (const visite of triees) {
    const date = new Date(dateDe(visite));
    const lisible = !Number.isNaN(date.getTime());
    const mois = lisible ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "sans-date";
    let groupe = groupes.find((g) => g.mois === mois);
    if (!groupe) {
      groupe = { mois, titre: lisible ? `${MOIS[date.getMonth()]} ${date.getFullYear()}` : "Sans date", visites: [] };
      groupes.push(groupe);
    }
    groupe.visites.push(visite);
  }
  return groupes;
}
