import { ecrireMoisLangue } from "@sos-miam/commun/fonctions/langue/ecrire-mois-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireMoisAnnee } from "~/fonctions/dates/ecrire-mois-annee";

export function ecrireMoisAnneeLangue(mois: string, langue: Langue): string {
  if (langue !== "en") return ecrireMoisAnnee(mois);
  const [annee, numero] = mois.split("-").map(Number);
  return numero >= 1 && numero <= 12 && Number.isInteger(annee) ? ecrireMoisLangue({ annee, mois: numero }, langue) : mois;
}
