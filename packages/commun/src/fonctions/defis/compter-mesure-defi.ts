import { FIN_DE_NUIT_HEURE } from "../../regles/defis.ts";
import type { FaitsDefi, FiltresDefi, MesureDefi, PeriodeDefi, VisiteDefi } from "../../types/defi.ts";
import { calculerDecalageParis } from "../temps/calculer-decalage-paris.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { calculerPlusLongueSuiteSemaines } from "./calculer-plus-longue-suite-semaines.ts";

/** L'heure qu'il est à Paris à cet instant (0 à 23) */
const lireHeureParis = (instantMs: number) => new Date(instantMs + calculerDecalageParis(instantMs)).getUTCHours();

/**
 * Le moteur de mesure des défis et des badges automatiques : ce que `mesure` compte dans les faits datés du compte,
 * seulement ceux dont le jour de Paris tombe dans la période (premier et dernier jour compris ; null : sans borne), avec
 * les filtres permis pour cette mesure (FILTRES_PAR_MESURE ; un autre filtre est ignoré). `apresHeure: 22` garde les visites
 * validées de 22 h à 5 h du matin (heure de Paris). Rend le nombre brut, sans le limiter à l'objectif.
 */
export function compterMesureDefi(faits: FaitsDefi, mesure: MesureDefi, filtres: FiltresDefi | null, periode: PeriodeDefi): number {
  const dansPeriode = (instantMs: number) => {
    const jour = calculerJourParis(instantMs);
    return (periode.debut === null || jour >= periode.debut) && (periode.fin === null || jour <= periode.fin);
  };
  const f = filtres ?? {};
  const garderVisite = (v: VisiteDefi, avecHeureEtSos: boolean) => {
    if (!dansPeriode(v.le)) return false;
    if (f.typesLieu && !(f.typesLieu as readonly string[]).includes(v.typeLieu)) return false;
    if (!avecHeureEtSos) return true;
    if (f.pendantSos === true && !v.pendantSos) return false;
    if (f.apresHeure !== undefined) {
      const heure = lireHeureParis(v.le);
      if (heure < f.apresHeure && heure >= FIN_DE_NUIT_HEURE) return false;
    }
    return true;
  };

  switch (mesure) {
    case "rescousses":
      return faits.rescousses.filter(dansPeriode).length;
    case "premiers-sauvetages":
      return faits.premiersSauvetages.filter(dansPeriode).length;
    case "visites":
      return faits.visites.filter((v) => garderVisite(v, true)).length;
    case "lieux-differents":
      return new Set(faits.visites.filter((v) => garderVisite(v, true)).map((v) => v.lieuId)).size;
    case "villes-differentes":
      // « Montpellier » et « montpellier » sont la même ville
      return new Set(faits.visites.filter((v) => garderVisite(v, false)).map((v) => v.ville.trim().toLocaleLowerCase("fr"))).size;
    case "semaines-d-affilee":
      return calculerPlusLongueSuiteSemaines(faits.visites.filter((v) => garderVisite(v, false)).map((v) => calculerJourParis(v.le)));
    case "avis":
      return faits.avis.filter((a) => dansPeriode(a.le) && (f.avecPhoto !== true || a.avecPhoto)).length;
  }
}
