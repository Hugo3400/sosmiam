/**
 * Le nom d'un champ de l'éditeur de carte, indexé comme un formulaire classique : « sections[0][titre] »,
 * « sections[0][elements][1][prix] ». Sert aussi de clé aux erreurs et au focus.
 */
export function nommerChampCarte(section: number, champ: string, element?: number): string {
  return element === undefined ? `sections[${section}][${champ}]` : `sections[${section}][elements][${element}][${champ}]`;
}
