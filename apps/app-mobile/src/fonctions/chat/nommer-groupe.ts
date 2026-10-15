/**
 * Le nom d'un groupe à l'écran : son titre, ou « Groupe » quand il n'en a pas (titre illisible, ou effacé par la
 * modération). Dans une phrase, ne mettre les guillemets qu'autour d'un vrai titre.
 */
export function nommerGroupe(titre: string | null | undefined): string {
  return titre?.trim() || "Groupe";
}
