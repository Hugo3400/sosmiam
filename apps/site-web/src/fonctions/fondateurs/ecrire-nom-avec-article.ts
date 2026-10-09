/**
 * Le nom d'une zone avec son article, tiré de sa forme « avec de » donnée par l'API (nomAvecDe), pour « Ta commune compte
 * avec le Rhône » : « du Rhône » → « le Rhône », « des Landes » → « les Landes », « de la Creuse » → « la Creuse »,
 * « de l'Ain » → « l'Ain », « d'Indre-et-Loire » → « Indre-et-Loire », « de Paris » → « Paris ».
 */
export function ecrireNomAvecArticle(nomAvecDe: string, nom: string): string {
  const trouve = /^(du|des|de la|de l['’]|de|d['’])\s*(.+)$/i.exec(nomAvecDe.trim());
  if (!trouve) return nom;
  const [, debut, reste] = trouve;
  const article: Record<string, string> = { du: "le ", des: "les ", "de la": "la ", "de l'": "l'", "de l’": "l’" };
  return `${article[debut.toLowerCase()] ?? ""}${reste}`;
}
