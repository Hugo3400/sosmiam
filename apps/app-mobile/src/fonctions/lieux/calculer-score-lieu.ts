import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { envieParChoix, typeParChoixLieu } from "~/contenus/correspondances-envies";

/**
 * Intérêt d'un lieu pour la personne, pour trier le fil « Pour toi » : ses envies (type de lieu, moments, régime),
 * un coup de pouce aux lieux qui ont besoin de monde (SOS, alerte, nouveauté), et un peu moins quand c'est loin.
 */
export function calculerScoreLieu(lieu: Lieu, profil: Profil): number {
  const envies = profil.envies;
  let score = 0;
  if ((envies.lieux ?? []).some((choix) => typeParChoixLieu[choix] === lieu.type)) score += 3;
  const ambiances = [...(envies.moments ?? []), ...(envies.regimes ?? [])].map((choix) => envieParChoix[choix]);
  score += 2 * lieu.envies.filter((envie) => ambiances.includes(envie)).length;
  if ((envies.moments ?? []).includes("petit-budget") && lieu.prix === "€") score += 1;
  if (lieu.sos) score += 2;
  if (lieu.alerte) score += 1;
  if (lieu.nouveau) score += 1;
  return score - lieu.km * 0.08;
}
