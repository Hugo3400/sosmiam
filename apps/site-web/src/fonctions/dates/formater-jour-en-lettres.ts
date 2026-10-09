const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Un jour « 2026-10-09 » (majLe d'une carte : jour de Paris) → « 9 octobre 2026 » (« 1er » le premier du mois) ; null si illisible. */
export function formaterJourEnLettres(jour: string): string | null {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  const mois = morceaux ? MOIS[Number(morceaux[2]) - 1] : undefined;
  if (!morceaux || !mois) return null;
  const quantieme = Number(morceaux[3]);
  return `${quantieme === 1 ? "1er" : quantieme} ${mois} ${morceaux[1]}`;
}
