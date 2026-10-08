import type { Pote } from "@sos-miam/commun/types/potes";

import { grapheSuivisExemples } from "~/contenus/suivis-exemples";
import { listerAbonnementsDe } from "~/fonctions/suivi/lister-abonnements-de";
import { listerAbonnesDe } from "~/fonctions/suivi/lister-abonnes-de";

/**
 * Les abonnés ou les abonnements d'une autre personne de la démo (graphe d'exemple, et toi selon tes liens avec elle),
 * sans personne bloquée ni inconnue. Un adulte n'y voit jamais les mineurs (ni dans la liste, ni dans le compte).
 */
export function listerPotesLiesDe(
  id: string,
  sens: "abonnes" | "abonnements",
  contexte: { mesAbonnes: readonly string[]; mesAbonnements: readonly string[]; bloques: ReadonlySet<string>; moiMineur: boolean; trouverPote: (id: string) => Pote | null },
): Pote[] {
  const ids = sens === "abonnes" ? listerAbonnesDe(id, grapheSuivisExemples, contexte.mesAbonnements) : listerAbonnementsDe(id, grapheSuivisExemples, contexte.mesAbonnes);
  return ids.flatMap((autre) => {
    const pote = contexte.bloques.has(autre) ? null : contexte.trouverPote(autre);
    return pote && (contexte.moiMineur || !pote.mineur) ? [pote] : [];
  });
}
