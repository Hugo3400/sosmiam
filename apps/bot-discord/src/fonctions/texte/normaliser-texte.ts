/** Minuscules, sans accents ni ponctuation : « C'est GRATUIT ? » → « c est gratuit ». Sert à comparer des saisies. */
export function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
