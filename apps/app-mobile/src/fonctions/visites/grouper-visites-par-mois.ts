import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Visite } from "@sos-miam/commun/types/visite";

import { TEXTES_MES_VISITES_PAR_LANGUE } from "~/contenus/textes-mes-visites";

/** Un mois de « Mes visites » : « 2026-10 », son titre (« Octobre 2026 ») et ses visites, de la plus récente à la plus ancienne */
export type MoisVisites = { mois: string; titre: string; visites: Visite[] };

/** Le moment qui compte : la validation (le passage à la caisse), sinon la demande */
const dateDe = (visite: Visite) => visite.valideLe ?? visite.creeLe;

const nommerMois = (index: number, langue: Langue) => {
  const nom = CALENDRIER_PAR_LANGUE[langue].mois[index] ?? "";
  return nom.charAt(0).toUpperCase() + nom.slice(1);
};

/**
 * Range les visites par mois, à l'heure du téléphone : le mois le plus récent d'abord, et dans chaque mois la visite la
 * plus récente d'abord. Une visite à la date illisible (ça ne devrait pas arriver) est mise de côté dans « Sans date », à la fin.
 */
export function grouperVisitesParMois(visites: readonly Visite[], langue: Langue): MoisVisites[] {
  const T = choisirTextes(TEXTES_MES_VISITES_PAR_LANGUE, langue);
  const triees = [...visites].sort((a, b) => (Date.parse(dateDe(b)) || 0) - (Date.parse(dateDe(a)) || 0));
  const groupes: MoisVisites[] = [];
  for (const visite of triees) {
    const date = new Date(dateDe(visite));
    const lisible = !Number.isNaN(date.getTime());
    const mois = lisible ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "sans-date";
    let groupe = groupes.find((g) => g.mois === mois);
    if (!groupe) {
      groupe = { mois, titre: lisible ? `${nommerMois(date.getMonth(), langue)} ${date.getFullYear()}` : T.sansDate, visites: [] };
      groupes.push(groupe);
    }
    groupe.visites.push(visite);
  }
  return groupes;
}
