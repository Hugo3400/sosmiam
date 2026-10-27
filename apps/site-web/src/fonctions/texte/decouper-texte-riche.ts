export type MorceauTexte =
  | { type: "texte"; texte: string }
  | { type: "gras"; texte: string }
  | { type: "lien"; texte: string; href: string }
  | { type: "francais"; texte: string };

const balisage = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|\{fr:(.+?)\}/g;

/** Découpe un texte avec **gras**, [lien](/adresse) et {fr:passage en français} en morceaux à afficher. */
export function decouperTexteRiche(texte: string): MorceauTexte[] {
  const morceaux: MorceauTexte[] = [];
  let fin = 0;
  for (const trouve of texte.matchAll(balisage)) {
    if (trouve.index > fin) morceaux.push({ type: "texte", texte: texte.slice(fin, trouve.index) });
    if (trouve[1] !== undefined) morceaux.push({ type: "gras", texte: trouve[1] });
    else if (trouve[4] !== undefined) morceaux.push({ type: "francais", texte: trouve[4] });
    else morceaux.push({ type: "lien", texte: trouve[2], href: trouve[3] });
    fin = trouve.index + trouve[0].length;
  }
  if (fin < texte.length) morceaux.push({ type: "texte", texte: texte.slice(fin) });
  return morceaux;
}
