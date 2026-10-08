/**
 * Lit une date tapée « JJ/MM/AAAA » et la rend en « AAAA-MM-JJ ».
 * Renvoie null si la saisie est incomplète ou si la date n'existe pas (un 31 février, par exemple).
 */
export function lireDateSaisie(texte: string): string | null {
  const morceaux = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texte.trim());
  if (!morceaux) return null;
  const [, jour, mois, annee] = morceaux;
  const date = new Date(Number(annee), Number(mois) - 1, Number(jour), 12);
  const existe = date.getFullYear() === Number(annee) && date.getMonth() === Number(mois) - 1 && date.getDate() === Number(jour);
  return existe ? `${annee}-${mois}-${jour}` : null;
}
