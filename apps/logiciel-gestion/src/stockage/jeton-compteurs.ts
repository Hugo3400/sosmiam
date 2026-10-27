const CLE_JETON = "sosmiam-gestion:jeton-compteurs";
const CLE_CHOIX = "sosmiam-gestion:rester-en-fond";

export type JetonCompteursGarde = { protege: string; creeLe: number };

export function lireJetonCompteursGarde(): JetonCompteursGarde | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_JETON) ?? "null") as JetonCompteursGarde | null;
    return brut && typeof brut.protege === "string" && typeof brut.creeLe === "number" ? brut : null;
  } catch {
    return null;
  }
}

export function garderJetonCompteurs(jeton: JetonCompteursGarde): void {
  try {
    localStorage.setItem(CLE_JETON, JSON.stringify(jeton));
  } catch {
    return;
  }
}

export function oublierJetonCompteurs(): void {
  try {
    localStorage.removeItem(CLE_JETON);
  } catch {
    return;
  }
}

export function lireChoixFond(): boolean {
  try {
    return localStorage.getItem(CLE_CHOIX) !== "non";
  } catch {
    return true;
  }
}

export function ecrireChoixFond(actif: boolean): void {
  try {
    localStorage.setItem(CLE_CHOIX, actif ? "oui" : "non");
  } catch {
    return;
  }
}
