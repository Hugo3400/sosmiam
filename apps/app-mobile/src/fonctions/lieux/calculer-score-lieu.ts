import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { envieParChoix, typeParChoixLieu } from "~/contenus/correspondances-envies";

// Une distance inconnue (même pas la ville du lieu, estimerKmPourClasser) compte comme plus loin que tout point de France,
// Corse comprise : quelles que soient les envies, jamais devant un lieu dont on sait où il est
const KM_SI_INCONNU = 2_000;

/**
 * Intérêt d'un lieu pour la personne, pour trier le fil « Pour toi » : ses envies (type de lieu, moments, régime),
 * un coup de pouce aux lieux qui ont besoin de monde (SOS, alerte, nouveauté), et un peu moins quand c'est loin.
 * « km » : sa distance pour classer (estimerKmPourClasser), null si on ne la connaît pas du tout.
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
