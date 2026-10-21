import { ORDRE_CHAMPS_SIGNALEMENT, type ChampSignalement } from "~/contenus/formulaire-securite";

export function lireChampSignalement(champ: string): ChampSignalement | null {
  if (/^images(\b|$)/.test(champ)) return "images";
  return ORDRE_CHAMPS_SIGNALEMENT.find((un) => un === champ) ?? null;
}
