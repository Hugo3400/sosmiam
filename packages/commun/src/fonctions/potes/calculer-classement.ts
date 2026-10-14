/** Une place du classement : la personne telle qu'on l'a donnée, son rang (partagé à égalité) et si c'est toi */
export type PlaceClassement<T> = { personne: T; rang: number; estMoi: boolean };

/**
 * Classement du mois entre potes (toi compris, déjà dans la liste) : points du mois, puis rescousses du mois ; même rang à
 * égalité (1, 2, 2, 4…). À égalité parfaite, l'ordre donné est gardé. moi : ton identifiant.
 */
export function calculerClassement<T extends { id: string; pointsDuMois: number; rescoussesDuMois: number }>(
  personnes: readonly T[],
  moi: string,
): PlaceClassement<T>[] {
  const tous = [...personnes].sort((a, b) => b.pointsDuMois - a.pointsDuMois || b.rescoussesDuMois - a.rescoussesDuMois);
  let rang = 0;
  return tous.map((personne, i) => {
    const precedent = tous[i - 1];
    if (!precedent || precedent.pointsDuMois !== personne.pointsDuMois || precedent.rescoussesDuMois !== personne.rescoussesDuMois) rang = i + 1;
    return { personne, rang, estMoi: personne.id === moi };
  });
}
