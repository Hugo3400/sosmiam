import type { Pote } from "@sos-miam/commun/types/potes";

export type ResultatRecherchePote = {
  pote: Pote;
  dejaDansLaBande: boolean;
  /** Faux pour un mineur cherché par un adulte : il ne s'ajoute que par lien ou QR code donné en main propre */
  ajoutable: boolean;
};

/**
 * Cherche des personnes par pseudo (avec ou sans « @ », début du pseudo). Les personnes bloquées n'apparaissent pas ;
 * un adulte voit qu'un mineur existe mais ne peut pas l'ajouter par la recherche.
 */
export function chercherParPseudo(annuaire: Pote[], texte: string, options: { moiMineur: boolean; bande: string[]; bloques: string[] }): ResultatRecherchePote[] {
  const cherche = texte.trim().toLowerCase().replace(/^@/, "");
  if (cherche.length < 2) return [];
  return annuaire
    .filter((p) => !options.bloques.includes(p.id) && p.pseudo.startsWith(cherche))
    .slice(0, 10)
    .map((pote) => ({ pote, dejaDansLaBande: options.bande.includes(pote.id), ajoutable: options.moiMineur || !pote.mineur }));
}
