/** Découpe une liste en paquets d'au plus `taille` éléments, dans l'ordre (l'API refuse plus de 500 lieux par envoi). */
export function decouperEnPaquets<T>(liste: readonly T[], taille: number): T[][] {
  const paquets: T[][] = [];
  for (let debut = 0; debut < liste.length; debut += taille) paquets.push(liste.slice(debut, debut + taille));
  return paquets;
}
