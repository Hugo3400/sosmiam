// Ce que le logiciel garde sur l'ordinateur (stockage de sa fenêtre, dans le profil Windows de Hugo) :
// le coffre, c'est-à-dire la clé secrète du poste chiffrée par le mot de passe. Jamais le mot de passe,
// jamais la clé en clair, jamais la session.

/** Clé du poste, chiffrée (AES-256-GCM, clé tirée du mot de passe par PBKDF2-SHA256) */
export type CoffreCle = {
  version: 1;
  /** Identifiant court, le même que celui affiché par le serveur */
  idPoste: string;
  /** Clé publique Ed25519 brute, en base64url : c'est elle qu'on autorise sur le serveur */
  clePublique: string;
  creeLe: string;
  iterations: number;
  sel: string;
  iv: string;
  chiffre: string;
};

const CLE_STOCKAGE = "sosmiam-gestion:coffre";

export function lireCoffre(): CoffreCle | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? "null") as CoffreCle | null;
    return brut?.version === 1 && brut.chiffre ? brut : null;
  } catch {
    return null;
  }
}

export function ecrireCoffre(coffre: CoffreCle): void {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(coffre));
}

export function oublierCoffre(): void {
  localStorage.removeItem(CLE_STOCKAGE);
}
