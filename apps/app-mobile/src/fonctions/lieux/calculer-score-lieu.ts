import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { envieParChoix, typeParChoixLieu } from "~/contenus/correspondances-envies";

// Une distance inconnue (lieu pas encore placé) compte comme loin, au bout du curseur d'Explorer : à envies égales,
// jamais devant un lieu dont on sait qu'il est près de toi
const KM_SI_INCONNU = 50;

/**
 * Intérêt d'un lieu pour la personne, pour trier le fil « Pour toi » : ses envies (type de lieu, moments, régime),
 * un coup de pouce aux lieux qui ont besoin de monde (SOS, alerte, nouveauté), et un peu moins quand c'est loin.
 * « km » : sa distance (calculerKmLieu), null si on ne la connaît pas.
 */
export function calculerScoreLieu(lieu: Lieu, profil: Profil, km: number | null): number {
  const envies = profil.envies;
  let score = 0;
  if ((envies.lieux ?? []).some((choix) => typeParChoixLieu[choix] === lieu.type)) score += 3;
  const ambiances = [...(envies.moments ?? []), ...(envies.regimes ?? [])].map((choix) => envieParChoix[choix]);
  score += 2 * lieu.envies.filter((envie) => ambiances.includes(envie)).length;
  if ((envies.moments ?? []).includes("petit-budget") && lieu.prix === "€") score += 1;
  if (lieu.sos) score += 2;
  if (lieu.alerte) score += 1;
  if (lieu.nouveau) score += 1;
  return score - (km ?? KM_SI_INCONNU) * 0.08;
}
