import type { EtiquetteLieu } from "../../types/etiquette.ts";
import { normaliserEtiquette } from "./normaliser-etiquette.ts";

export function porteEtiquette(etiquettes: readonly EtiquetteLieu[], nom: string): boolean {
  const cle = normaliserEtiquette(nom);
  return etiquettes.some((e) => normaliserEtiquette(e.nom) === cle);
}
