import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_MOMENTS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-moments-miamis";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function ecrireQuandCourt(iso: string, langue: Langue, maintenant: Date = new Date()): string {
  const T = choisirTextes(TEXTES_MOMENTS_MIAMIS_PAR_LANGUE, langue);
  const date = new Date(iso);
  const court = choisirTextes(CALENDRIER_PAR_LANGUE, langue).joursCourts[date.getDay()] ?? "";
  const jourCourt = court.charAt(0).toUpperCase() + court.slice(1);
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  const jour = ecart === 0 ? T.aujourdhui : ecart === 1 ? T.demain : ecart < 7 ? jourCourt : `${jourCourt} ${date.getDate()}/${date.getMonth() + 1}`;
  return `${jour} ${ecrireHeureLangue(date, langue)}`;
}
