/** Vrai si le compte est privé : seulement s'il l'a choisi (public par défaut). */
export function estComptePrive(compte: { prive?: boolean }): boolean {
  return compte.prive === true;
}
