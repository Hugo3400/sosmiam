// Réglages de ce poste, gardés sur l'ordinateur (stockage de la fenêtre du logiciel).

const CLE_VERROU = "sosmiam-gestion:verrou-minutes";
/** Choix proposés pour le verrouillage automatique ; null = jamais */
export const CHOIX_VERROU: (number | null)[] = [20, 60, 240, null];
const PAR_DEFAUT = 60;

/** Minutes sans souris ni clavier avant que le logiciel se verrouille (null : jamais). */
export function lireMinutesVerrou(): number | null {
  try {
    const brut = localStorage.getItem(CLE_VERROU);
    if (brut === "jamais") return null;
    const minutes = Number(brut);
    return CHOIX_VERROU.includes(minutes) ? minutes : PAR_DEFAUT;
  } catch {
    return PAR_DEFAUT;
  }
}

export function ecrireMinutesVerrou(minutes: number | null): void {
  try {
    localStorage.setItem(CLE_VERROU, minutes === null ? "jamais" : String(minutes));
  } catch {
    // Stockage indisponible : le choix vaut jusqu'à la fermeture du logiciel
  }
}
