import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { envieParChoix, LIBELLE_PAR_ENVIE_PAR_LANGUE, LIBELLE_PAR_TYPE_PAR_LANGUE, typeParChoixLieu } from "~/contenus/correspondances-envies";
import { TEXTES_RAISON_LIEU_PAR_LANGUE } from "~/contenus/textes-raison-lieu";

/**
 * Pourquoi ce lieu est proposé à la personne (« Parce que tu aimes les restos »), ou null si rien de particulier.
 * « km » : sa distance (calculerKmLieu), null si on ne la connaît pas (jamais « À deux pas » alors).
 */
export function trouverRaisonLieu(lieu: Lieu, profil: Profil, km: number | null, langue: Langue): string | null {
  const T = choisirTextes(TEXTES_RAISON_LIEU_PAR_LANGUE, langue);
  const envies = profil.envies;
  if ((envies.lieux ?? []).some((choix) => typeParChoixLieu[choix] === lieu.type)) return T.parceQueTuAimes(choisirTextes(LIBELLE_PAR_TYPE_PAR_LANGUE, langue)[lieu.type]);
  const ambiances = [...(envies.moments ?? []), ...(envies.regimes ?? [])].map((choix) => envieParChoix[choix]);
  const commune = lieu.envies.find((envie) => ambiances.includes(envie));
  if (commune) return choisirTextes(LIBELLE_PAR_ENVIE_PAR_LANGUE, langue)[commune];
  if ((envies.moments ?? []).includes("petit-budget") && lieu.prix === "€") return T.petitPrix;
  if (km !== null && km < 1) return T.aDeuxPas;
  return null;
}
