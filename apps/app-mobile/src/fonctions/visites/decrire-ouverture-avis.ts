import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Visite } from "@sos-miam/commun/types/visite";

import { TEXTES_VISITE_PAR_LANGUE } from "~/contenus/textes-visite";
import { ecrireAttenteLangue } from "~/fonctions/langue/ecrire-attente-langue";

const INSECABLE = "\u00a0";

function ecrireJourDuMois(date: Date, langue: Langue): string {
  const jour = date.getDate();
  return `${jour === 1 && langue === "fr" ? "1er" : jour}${INSECABLE}${CALENDRIER_PAR_LANGUE[langue].mois[date.getMonth()]}`;
}

export function decrireOuvertureAvis(avis: Visite["avis"], langue: Langue, maintenant: Date = new Date()): string | null {
  const T = choisirTextes(TEXTES_VISITE_PAR_LANGUE, langue);
  const etat = decrireEtatAvis(avis, maintenant.getTime());
  if (!avis || etat === "aucun" || etat === "donne" || etat === "ferme") return null;
  if (etat === "ouvert") return T.avisOuvert(ecrireJourDuMois(new Date(avis.fermeLe), langue));
  const ouvertLe = new Date(avis.ouvertLe);
  const heure = formaterHeureLangue(ouvertLe.getHours(), ouvertLe.getMinutes(), langue, { espacee: true });
  return T.avisAVenir(heure, ecrireAttenteLangue(ouvertLe.getTime() - maintenant.getTime(), langue));
}
