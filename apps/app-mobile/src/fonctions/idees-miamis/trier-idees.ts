import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import type { FiltreIdees } from "~/contenus/textes-idees";

export function trierIdees(idees: readonly IdeeMiamis[], filtre: FiltreIdees): IdeeMiamis[] {
  if (filtre === "nouvelles") return [...idees].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const choisies = filtre === "prevues" ? idees.filter((i) => i.statut === "a-l-etude" || i.statut === "prevue") : filtre === "faites" ? idees.filter((i) => i.statut === "faite") : idees;
  return [...choisies].sort((a, b) => b.votes - a.votes);
}
