import type { EtatDefi } from "../../types/defi.ts";

/**
 * Où en est un défi le jour `jourParis` (« AAAA-MM-JJ » à Paris : calculerJourParis, jamais l'horloge du téléphone) :
 * réussi (même après sa fin : une réussite reste acquise), à venir avant son premier jour, terminé après son dernier jour
 * (compris), en cours sinon. Les jours « AAAA-MM-JJ » se comparent comme du texte.
 */
export function calculerEtatDefi(defi: { debut: string; fin: string | null }, reussi: boolean, jourParis: string): EtatDefi {
  if (reussi) return "reussi";
  if (jourParis < defi.debut) return "a-venir";
  if (defi.fin !== null && jourParis > defi.fin) return "termine";
  return "en-cours";
}
