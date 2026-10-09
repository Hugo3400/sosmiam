import { LIBELLES_AVANTAGE, LIBELLES_REGLEMENT_CLIENT, LIBELLES_REGLEMENT_LIEU } from "../../contenus/libelles-reglement.ts";
import type { ReglementVisite } from "../../types/visite.ts";

export type ReglementDecrit = {
  /** « Payée », « Payée avec réduction −20 % », « Offerte par le lieu » (ou la version du lieu) */
  titre: string;
  /** Les avantages, en étiquettes courtes ; la collaboration commerciale toujours en premier */
  etiquettes: string[];
  /** Vrai si la visite a été offerte : ni points ni tampon */
  offert: boolean;
};

/**
 * Ce qu'on affiche du règlement d'une visite, pour le client ou pour l'équipe du lieu. Une visite validée sans
 * règlement connu (d'avant le 9 octobre 2026) se lit « payée », la seule façon de valider jusque-là.
 */
export function decrireReglement(r: ReglementVisite | null, pour: "client" | "lieu"): ReglementDecrit {
  const reglement: ReglementVisite = r ?? { type: "paye", reductionPourcent: null, avantages: [] };
  const libelles = pour === "client" ? LIBELLES_REGLEMENT_CLIENT : LIBELLES_REGLEMENT_LIEU;
  const reduction = reglement.type === "reduction" && reglement.reductionPourcent !== null ? ` −${reglement.reductionPourcent} %` : "";
  const avantages = [...new Set(reglement.avantages)].sort((a, b) => (a === "partenariat" ? -1 : b === "partenariat" ? 1 : 0));
  return {
    titre: `${libelles[reglement.type]}${reduction}`,
    etiquettes: avantages.map((a) => LIBELLES_AVANTAGE[a]),
    offert: reglement.type === "offert",
  };
}
