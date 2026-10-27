import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { nommerJourLangue } from "../../../../../packages/commun/src/fonctions/langue/nommer-jour-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { formaterHeureCourteLangue } from "~/fonctions/dates/formater-heure-courte-langue";
import type { EtatOuverture } from "~/fonctions/lieux/decrire-ouverture";

export function ecrireOuverture(ouverture: EtatOuverture, langue: Langue): string {
  const T = choisirTextes(TEXTES_FICHE_LIEU_PAR_LANGUE, langue).ouverture;
  if (ouverture.heure === null) return T.ouvertSansArret;
  const heure = ouverture.heure === "00:00" ? T.minuit : formaterHeureCourteLangue(ouverture.heure, langue) ?? ouverture.heure;
  if (ouverture.ouvert) return T.ouvert(heure);
  if (ouverture.quand === "aujourdhui") return T.fermeAujourdhui(heure);
  if (ouverture.quand === "demain") return T.fermeDemain(heure);
  return T.fermeJour(nommerJourLangue(ouverture.jourSemaine, langue), heure);
}
