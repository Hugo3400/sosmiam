const CLE = "sosmiam-gestion:deverrouillage-retenu";
const CLE_CHOIX = "sosmiam-gestion:retenir-heures";

export const DUREE_RETENUE_MAX_MS = 5 * 24 * 3600_000;
export const CHOIX_RETENUE: { valeur: string; libelle: string; heures: number }[] = [
  { valeur: "0", libelle: "Non, à chaque ouverture", heures: 0 },
  { valeur: "1", libelle: "1 heure", heures: 1 },
  { valeur: "4", libelle: "4 heures", heures: 4 },
  { valeur: "24", libelle: "24 heures", heures: 24 },
  { valeur: "72", libelle: "3 jours", heures: 72 },
  { valeur: "120", libelle: "5 jours", heures: 120 },
];

export type DeverrouillageRetenu = { protegee: string; expireLe: number };

export function lireDeverrouillageRetenu(maintenant = Date.now()): DeverrouillageRetenu | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as DeverrouillageRetenu | null;
    if (!brut?.protegee || typeof brut.expireLe !== "number") return null;
    if (brut.expireLe <= maintenant || brut.expireLe > maintenant + DUREE_RETENUE_MAX_MS) {
      localStorage.removeItem(CLE);
      return null;
    }
    return brut;
  } catch {
    return null;
  }
}

export function ecrireDeverrouillageRetenu(retenu: DeverrouillageRetenu): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(retenu));
  } catch {
    return;
  }
}

export function oublierDeverrouillageRetenu(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    return;
  }
}

export function lireChoixRetenue(): string {
  try {
    const choix = localStorage.getItem(CLE_CHOIX) ?? "0";
    return CHOIX_RETENUE.some((c) => c.valeur === choix) ? choix : "0";
  } catch {
    return "0";
  }
}

export function ecrireChoixRetenue(choix: string): void {
  try {
    localStorage.setItem(CLE_CHOIX, choix);
  } catch {
    return;
  }
}
