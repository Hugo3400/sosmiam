import type { IdeeMiamis } from "@sos-miam/commun/types/idees";

function lireMois(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function trouverIdeeDuMois(idees: readonly IdeeMiamis[], maintenant: Date = new Date()): IdeeMiamis | null {
  const ceMois = lireMois(maintenant);
  const moisDernier = lireMois(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1));
  let choisie: IdeeMiamis | null = null;
  for (const idee of idees) {
    const mois = idee.ideeDuMois?.slice(0, 7) ?? null;
    if (mois === null || (mois !== ceMois && mois !== moisDernier)) continue;
    if (!choisie || mois > (choisie.ideeDuMois?.slice(0, 7) ?? "")) choisie = idee;
  }
  return choisie;
}
