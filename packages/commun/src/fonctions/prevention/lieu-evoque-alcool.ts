import type { Lieu } from "../../types/lieu.ts";
import { parleDAlcool } from "./parle-d-alcool.ts";

/**
 * Vrai si la fiche d'un lieu évoque l'alcool : un bar, ou un lieu dont le message du moment, l'offre SOS, le plat signature,
 * la présentation ou les étiquettes parlent d'alcool (un happy hour, un verre de picpoul…). Le message sanitaire s'affiche
 * alors sur sa fiche et ses publications. La carte (boissons alcoolisées) se vérifie à part : carteContientAlcool.
 */
export function lieuEvoqueAlcool(lieu: Pick<Lieu, "type" | "alerte" | "sos" | "plat" | "info" | "tags">): boolean {
  if (lieu.type === "bar") return true;
  return parleDAlcool([lieu.alerte, lieu.sos?.offre, lieu.plat, lieu.info, ...lieu.tags].filter(Boolean).join(" · "));
}
