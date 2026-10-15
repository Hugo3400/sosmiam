import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Visite } from "@sos-miam/commun/types/visite";

import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";
import { ecrireHeureEspacee } from "~/fonctions/dates/ecrire-heure-espacee";

const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const INSECABLE = " ";

function ecrireJourDuMois(date: Date): string {
  const jour = date.getDate();
  return `${jour === 1 ? "1er" : jour}${INSECABLE}${NOMS_DES_MOIS[date.getMonth()]}`;
}

export function decrireOuvertureAvis(avis: Visite["avis"], maintenant: Date = new Date()): string | null {
  const etat = decrireEtatAvis(avis, maintenant.getTime());
  if (!avis || etat === "aucun" || etat === "donne" || etat === "ferme") return null;
  if (etat === "ouvert") return `Ton avis t'attend : tu as jusqu'au ${ecrireJourDuMois(new Date(avis.fermeLe))} pour le donner, à tête reposée.`;
  const ouvertLe = new Date(avis.ouvertLe);
  return `Ton avis s'ouvre à ${ecrireHeureEspacee(ouvertLe)}, dans ${ecrireAttente(ouvertLe.getTime() - maintenant.getTime())}. Pas devant le patron.`;
}
