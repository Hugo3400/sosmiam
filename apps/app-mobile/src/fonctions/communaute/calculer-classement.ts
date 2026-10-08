import type { Pote } from "@sos-miam/commun/types/potes";

export type PlaceClassement = { pote: Pote; rang: number; estMoi: boolean };

/** Classement du mois entre potes (toi compris) : points du mois, puis rescousses du mois ; même rang à égalité. */
export function calculerClassement(potes: Pote[], moi: Pote): PlaceClassement[] {
  const tous = [...potes, moi].sort((a, b) => b.pointsDuMois - a.pointsDuMois || b.rescoussesDuMois - a.rescoussesDuMois);
  let rang = 0;
  return tous.map((pote, i) => {
    const precedent = tous[i - 1];
    if (!precedent || precedent.pointsDuMois !== pote.pointsDuMois || precedent.rescoussesDuMois !== pote.rescoussesDuMois) rang = i + 1;
    return { pote, rang, estMoi: pote.id === moi.id };
  });
}
