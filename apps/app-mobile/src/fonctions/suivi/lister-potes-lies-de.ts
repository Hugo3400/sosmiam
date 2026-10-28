import type { Pote } from "@sos-miam/commun/types/potes";

import { listerAbonnementsDe } from "~/fonctions/suivi/lister-abonnements-de";
import { listerAbonnesDe } from "~/fonctions/suivi/lister-abonnes-de";

const AUCUN_LIEN_CONNU: Readonly<Record<string, readonly string[]>> = {};

/**
 * Les abonnés ou les abonnements d'une autre personne gardée sur le téléphone (toi selon tes liens avec elle : ses autres
 * liens ne sont connus que du serveur), sans personne bloquée ni inconnue. monId : ton identifiant (utiliserMonId).
 */
export function listerPotesLiesDe(
  id: string,
  sens: "abonnes" | "abonnements",
  contexte: { monId: string; mesAbonnes: readonly string[]; mesAbonnements: readonly string[]; bloques: ReadonlySet<string>; trouverPote: (id: string) => Pote | null },
): Pote[] {
  const ids =
    sens === "abonnes"
      ? listerAbonnesDe(id, AUCUN_LIEN_CONNU, contexte.mesAbonnements, contexte.monId)
      : listerAbonnementsDe(id, AUCUN_LIEN_CONNU, contexte.mesAbonnes, contexte.monId);
  return ids.flatMap((autre) => {
    const pote = contexte.bloques.has(autre) ? null : contexte.trouverPote(autre);
    return pote ? [pote] : [];
  });
}
