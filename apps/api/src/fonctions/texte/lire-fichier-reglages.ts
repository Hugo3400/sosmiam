/**
 * Lit un fichier de réglages « CLE=valeur » (une par ligne, « # » pour un commentaire), comme
 * scripts/recuperer-inscrits.py : la valeur est gardée telle quelle (un mot de passe peut contenir des espaces).
 */
export function lireFichierReglages(texte: string): Record<string, string> {
  const reglages: Record<string, string> = {};
  for (const ligne of texte.split(/\r?\n/)) {
    if (!ligne.trim() || ligne.trimStart().startsWith("#") || !ligne.includes("=")) continue;
    const separateur = ligne.indexOf("=");
    reglages[ligne.slice(0, separateur).trim()] = ligne.slice(separateur + 1);
  }
  return reglages;
}
