import type { Pote } from "@sos-miam/commun/types/potes";

export type ResultatRecherchePote = {
  pote: Pote;
  dejaDansLaBande: boolean;
};

/**
 * Cherche des personnes par pseudo (avec ou sans « @ », début du pseudo), le pseudo exact en tête. Les personnes bloquées
 * n'apparaissent pas. Un adulte ne voit pas les mineurs, sauf ceux déjà dans sa bande : la recherche ne doit pas lui dire qui a moins de 18 ans.
 */
export function chercherParPseudo(annuaire: Pote[], texte: string, options: { moiMineur: boolean; bande: string[]; bloques: string[] }): ResultatRecherchePote[] {
  const cherche = texte.trim().toLowerCase().replace(/^@/, "");
  if (cherche.length < 2) return [];
  return annuaire
    .filter((p) => !options.bloques.includes(p.id) && p.pseudo.startsWith(cherche))
    .filter((p) => options.moiMineur || !p.mineur || options.bande.includes(p.id))
    .sort((a, b) => Number(b.pseudo === cherche) - Number(a.pseudo === cherche))
    .slice(0, 10)
    .map((pote) => ({ pote, dejaDansLaBande: options.bande.includes(pote.id) }));
}
