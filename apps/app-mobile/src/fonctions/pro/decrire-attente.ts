import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-demandes-comptoir";

const MINUTE_MS = 60_000;

/** Depuis quand une demande attend au comptoir : « à l'instant », « depuis 3 min », « depuis 1 h 05 ». */
export function decrireAttente(depuis: string, langue: Langue, maintenant: Date = new Date()): string {
  const T = choisirTextes(TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE, langue).attente;
  const minutes = Math.floor((maintenant.getTime() - Date.parse(depuis)) / MINUTE_MS);
  if (!Number.isFinite(minutes) || minutes < 1) return T.instant;
  if (minutes < 60) return T.minutes(minutes);
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? T.heures(heures) : T.heuresMinutes(heures, reste);
}
