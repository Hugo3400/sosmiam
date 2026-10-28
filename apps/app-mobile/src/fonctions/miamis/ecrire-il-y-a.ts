import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_MOMENTS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-moments-miamis";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";

export function ecrireIlYa(iso: string, langue: Langue, maintenant: Date = new Date()): string {
  const T = choisirTextes(TEXTES_MOMENTS_MIAMIS_PAR_LANGUE, langue);
  const minutes = Math.floor((maintenant.getTime() - Date.parse(iso)) / 60_000);
  if (Number.isNaN(minutes) || minutes < 1) return T.aLInstant;
  if (minutes < 60) return T.ilYaMinutes(minutes);
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return T.ilYaHeures(heures);
  const jours = Math.floor(heures / 24);
  if (jours === 1) return T.hier;
  if (jours < 7) return T.ilYaJours(jours);
  return T.leJour(ecrireDateLongueLangue(formaterDateIso(new Date(iso)), langue).replace(/ \d+$/, ""));
}
