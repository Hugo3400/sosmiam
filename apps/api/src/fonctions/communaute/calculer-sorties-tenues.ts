import type { SortiesTenues } from "../../../../../packages/commun/src/types/sorties-miamis.ts";
import type { HistoriqueSortieMiamis } from "../../services/communaute-regles.ts";

export function calculerSortiesTenues(historiques: readonly HistoriqueSortieMiamis[], maintenant: Date): Map<number, SortiesTenues> {
  const bilans = new Map<number, SortiesTenues>();
  const ajouter = (compteId: number, tenue: boolean) => {
    const bilan = bilans.get(compteId) ?? { tenues: 0, prevues: 0 };
    bilan.prevues += 1;
    if (tenue) bilan.tenues += 1;
    bilans.set(compteId, bilan);
  };
  for (const h of historiques) {
    const passee = h.quand.getTime() <= maintenant.getTime();
    if (h.statut === "organise") {
      if (h.autresAcceptes === 0) continue;
      if (h.annulee) {
        if (h.annulationTardive) ajouter(h.compteId, false);
      } else if (passee) {
        ajouter(h.compteId, true);
      }
    } else if (!h.annulee && passee && (h.statut === "accepte" || h.statut === "desiste")) {
      ajouter(h.compteId, h.statut === "accepte");
    }
  }
  return bilans;
}
