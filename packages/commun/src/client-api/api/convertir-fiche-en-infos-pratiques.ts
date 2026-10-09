// La fiche pro d'un lieu (GET /pro/lieux/:id de l'API) ramenée aux infos pratiques de l'app : une info inconnue (null)
// devient absente, comme sur la fiche (on ne devine jamais).

import type { InfosPratiques } from "../../types/infos-pratiques.ts";

const CHAMPS = ["telephone", "siteWeb", "instagram", "animaux", "accessible", "terrasse", "wifi", "enfants", "parking", "paiements", "reservation"] as const;

export function convertirFicheEnInfosPratiques(fiche: Record<string, unknown>): InfosPratiques {
  const infos: Record<string, unknown> = {};
  for (const champ of CHAMPS) {
    const valeur = fiche[champ];
    if (valeur === null || valeur === undefined || valeur === "" || (Array.isArray(valeur) && valeur.length === 0)) continue;
    infos[champ] = valeur;
  }
  return infos as InfosPratiques;
}
