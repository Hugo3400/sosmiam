export type MorceauTexte =
  | { type: "texte"; texte: string }
  | { type: "gras"; texte: string }
  | { type: "lien"; texte: string; href: string };

const balisage = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

/** Découpe un texte avec **gras** et [lien](/adresse) en morceaux à afficher. */
export function decouperTexteRiche(texte: string): MorceauTexte[] {
  const morceaux: MorceauTexte[] = [];
  let fin = 0;
  for (const trouve of texte.matchAll(balisage)) {
    if (trouve.index > fin) morceaux.push({ type: "texte", texte: texte.slice(fin, trouve.index) });
    morceaux.push(trouve[1] !== undefined
      ? { type: "gras", texte: trouve[1] }
      : { type: "lien", texte: trouve[2], href: trouve[3] });
    fin = trouve.index + trouve[0].length;
  }
  if (fin < texte.length) morceaux.push({ type: "texte", texte: texte.slice(fin) });
  return morceaux;
}
