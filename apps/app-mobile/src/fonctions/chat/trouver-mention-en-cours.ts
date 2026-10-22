const MENTION_EN_COURS = /(^|\s)@([a-z0-9._]{0,20})$/i;

export function trouverMentionEnCours(texte: string, curseur: number): { debut: number; recherche: string } | null {
  const fin = Math.max(0, Math.min(curseur, texte.length));
  const trouvee = MENTION_EN_COURS.exec(texte.slice(0, fin));
  if (!trouvee) return null;
  return { debut: fin - trouvee[2].length, recherche: trouvee[2].toLowerCase() };
}
