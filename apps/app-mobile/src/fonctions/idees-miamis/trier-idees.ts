import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import type { FiltreIdees } from "~/contenus/textes-idees";

const plusRecente = (a: IdeeMiamis, b: IdeeMiamis) => Date.parse(b.date) - Date.parse(a.date);
const plusVotee = (a: IdeeMiamis, b: IdeeMiamis) => b.votes - a.votes || plusRecente(a, b);

export function trierIdees(idees: readonly IdeeMiamis[], filtre: FiltreIdees): IdeeMiamis[] {
  if (filtre === "nouvelles") return [...idees].sort(plusRecente);
  if (filtre === "prevues") return idees.filter((i) => i.statut === "a-l-etude" || i.statut === "prevue").sort(plusVotee);
  if (filtre === "faites") return idees.filter((i) => i.statut === "faite").sort(plusRecente);
  return [...idees].sort(plusVotee);
}
