import type { ModeApp } from "@sos-miam/commun/types/roles";

const FENETRE_RESTAURATION_MS = 8000;

export function choisirModeARestaurer(dernierMode: ModeApp, modesOuverts: readonly ModeApp[], avecProfil: boolean, ecouleMs: number): "pro" | "ambassadeur" | null {
  if (!avecProfil || dernierMode === "perso" || ecouleMs > FENETRE_RESTAURATION_MS) return null;
  return modesOuverts.includes(dernierMode) ? dernierMode : null;
}
