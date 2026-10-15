import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";

export function plafonnerCarrouselSos(sos: LieuExplorer[], plafond: number): LieuExplorer[] {
  if (sos.length <= plafond) return sos;
  let placesRestantes = Math.max(0, plafond - sos.filter(({ lieu }) => lieu.sos).length);
  const gardes: LieuExplorer[] = [];
  for (const element of sos) {
    if (element.lieu.sos) gardes.push(element);
    else if (placesRestantes > 0) {
      gardes.push(element);
      placesRestantes--;
    }
  }
  return gardes;
}
