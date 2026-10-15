import type { PopUpApp } from "~/services/pop-ups-app.ts";

export type EtatPopUp = "brouillon" | "a-venir" | "en-ligne" | "finie" | "retiree";

export function decrireEtatPopUp(p: Pick<PopUpApp, "publieeLe" | "retireeLe" | "debut" | "fin">, maintenant = Date.now()): EtatPopUp {
  if (p.retireeLe) return "retiree";
  if (!p.publieeLe) return "brouillon";
  if (p.fin && Date.parse(p.fin) <= maintenant) return "finie";
  return Date.parse(p.debut) > maintenant ? "a-venir" : "en-ligne";
}
