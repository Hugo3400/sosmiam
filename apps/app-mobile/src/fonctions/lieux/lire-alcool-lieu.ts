import { lieuEvoqueAlcool } from "@sos-miam/commun/fonctions/prevention/lieu-evoque-alcool";
import type { Lieu } from "@sos-miam/commun/types/lieu";

const alcools = new WeakMap<Lieu, boolean>();

export function lireAlcoolLieu(lieu: Lieu): boolean {
  const deja = alcools.get(lieu);
  if (deja !== undefined) return deja;
  const alcool = lieuEvoqueAlcool(lieu);
  alcools.set(lieu, alcool);
  return alcool;
}
