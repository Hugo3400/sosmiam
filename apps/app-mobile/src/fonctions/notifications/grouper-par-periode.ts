/** Un groupe de l'écran Notifications : « Aujourd'hui », « Cette semaine » ou « Plus tôt » */
export type GroupePeriode<T> = { periode: "aujourdhui" | "semaine" | "plus-tot"; titre: string; elements: T[] };

const TITRES: Record<GroupePeriode<unknown>["periode"], string> = { aujourdhui: "Aujourd'hui", semaine: "Cette semaine", "plus-tot": "Plus tôt" };

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Range des éléments datés (ISO) par période, dans cet ordre : aujourd'hui, les 6 jours d'avant, puis plus tôt.
 * L'ordre reçu est gardé dans chaque groupe ; les groupes vides sont retirés. Une date illisible (ou dans le futur) compte pour aujourd'hui.
 */
export function grouperParPeriode<T extends { date: string }>(elements: readonly T[], maintenant: Date = new Date()): GroupePeriode<T>[] {
  const groupes: GroupePeriode<T>[] = (["aujourdhui", "semaine", "plus-tot"] as const).map((periode) => ({ periode, titre: TITRES[periode], elements: [] }));
  const aujourdhui = debutDuJour(maintenant);
  for (const element of elements) {
    const date = new Date(element.date);
    // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
    const ecart = Number.isNaN(date.getTime()) ? 0 : Math.round((aujourdhui - debutDuJour(date)) / 86_400_000);
    groupes[ecart <= 0 ? 0 : ecart < 7 ? 1 : 2].elements.push(element);
  }
  return groupes.filter((g) => g.elements.length > 0);
}
