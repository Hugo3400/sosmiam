import { eliderDe } from "~/fonctions/texte/elider-de";

const ARTICLE = /^(le|les)\s+/i;

export function direDeVille(nom: string): string {
  const article = ARTICLE.exec(nom);
  if (!article) return eliderDe(nom);
  return `${article[1].toLowerCase() === "le" ? "du" : "des"} ${nom.slice(article[0].length)}`;
}
