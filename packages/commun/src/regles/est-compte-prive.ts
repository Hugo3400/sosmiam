/** Vrai si le compte est privé : un mineur l'est toujours, un adulte seulement s'il l'a choisi. */
export function estComptePrive(compte: { mineur: boolean; prive?: boolean }): boolean {
  return compte.mineur || compte.prive === true;
}
