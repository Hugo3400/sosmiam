import { calculerRappelVeille } from "@sos-miam/commun/fonctions/sorties-miamis/calculer-rappel-veille";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";

export function ecrireRappelVeille(quand: string, langue: Langue, maintenant: Date = new Date()): { jour: string; heure: string } | null {
  const rappel = calculerRappelVeille(Date.parse(quand));
  if (Number.isNaN(rappel) || rappel <= maintenant.getTime()) return null;
  const jour = ecrireJourLongLangue(new Date(rappel), langue, maintenant);
  return { jour: langue === "en" ? jour : jour.charAt(0).toLowerCase() + jour.slice(1), heure: ecrireHeureLangue(new Date(rappel), langue) };
}
