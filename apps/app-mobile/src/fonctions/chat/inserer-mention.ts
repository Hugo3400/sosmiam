export function insererMention(texte: string, debut: number, curseur: number, pseudo: string): { texte: string; curseur: number } {
  const apres = texte.slice(curseur);
  const espace = apres.startsWith(" ") ? "" : " ";
  const avant = `${texte.slice(0, debut)}${pseudo}${espace}`;
  return { texte: `${avant}${apres}`, curseur: avant.length + (espace ? 0 : 1) };
}
