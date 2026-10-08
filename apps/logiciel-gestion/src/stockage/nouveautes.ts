// Mise à jour en cours d'installation : sa version et ses nouveautés, gardées le temps que le logiciel se rouvre,
// pour afficher « Logiciel à jour » au redémarrage.
const CLE = "sosmiam-gestion:mise-a-jour-installee";

export type NouveautesInstallees = { version: string; notes: string | null };

export function noterMiseAJourInstallee(nouveautes: NouveautesInstallees): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(nouveautes));
  } catch {
    // Pas grave : le bandeau « Logiciel à jour » ne s'affichera simplement pas
  }
}

/** Lit (et oublie) la mise à jour installée, si elle correspond à la version qui tourne maintenant. */
export function lireMiseAJourInstallee(versionActuelle: string): NouveautesInstallees | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as NouveautesInstallees | null;
    if (!brut || brut.version !== versionActuelle) return null;
    localStorage.removeItem(CLE);
    return brut;
  } catch {
    return null;
  }
}
