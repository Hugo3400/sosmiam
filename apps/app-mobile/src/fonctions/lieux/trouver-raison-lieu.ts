import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { envieParChoix, libelleParEnvie, libelleParType, typeParChoixLieu } from "~/contenus/correspondances-envies";

/** Pourquoi ce lieu est proposé à la personne (« Parce que tu aimes les restos »), ou null si rien de particulier. */
export function trouverRaisonLieu(lieu: Lieu, profil: Profil): string | null {
  const envies = profil.envies;
  if ((envies.lieux ?? []).some((choix) => typeParChoixLieu[choix] === lieu.type)) return `Parce que tu aimes ${libelleParType[lieu.type]}`;
  const ambiances = [...(envies.moments ?? []), ...(envies.regimes ?? [])].map((choix) => envieParChoix[choix]);
  const commune = lieu.envies.find((envie) => ambiances.includes(envie));
  if (commune) return libelleParEnvie[commune];
  if ((envies.moments ?? []).includes("petit-budget") && lieu.prix === "€") return "Petit prix, grand plaisir";
  if (lieu.km < 1) return "À deux pas de chez toi";
  return null;
}
