import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";
import type { SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { correspondAMesEnvies } from "~/fonctions/miamis/correspond-a-mes-envies";

export type FiltreSortiesMiamis = { type: "toutes" } | { type: "envies" } | { type: "etiquette"; nom: string };

export function filtrerSortiesMiamis(sorties: readonly SortieMiamis[], filtre: FiltreSortiesMiamis, envies: readonly string[]): SortieMiamis[] {
  if (filtre.type === "toutes") return [...sorties];
  if (filtre.type === "envies") return sorties.filter((s) => correspondAMesEnvies(s, envies));
  const cle = normaliserEtiquette(filtre.nom);
  return sorties.filter((s) => s.etiquettes.some((e) => normaliserEtiquette(e.nom) === cle));
}
