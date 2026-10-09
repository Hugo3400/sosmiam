import { useState } from "react";

/**
 * Montre une longue liste par morceaux : les `premiers` d'abord, puis `parPage` de plus à chaque « Voir plus » (comme les pages
 * que servira l'API). Un élément retiré ne replie rien : ce qui était déjà déplié le reste.
 */
export function utiliserPagination<T>(elements: readonly T[], premiers: number, parPage: number = premiers) {
  const [pagesEnPlus, setPagesEnPlus] = useState(0);
  const visibles = elements.slice(0, premiers + pagesEnPlus * parPage);
  const restants = elements.length - visibles.length;
  return {
    visibles,
    /** Combien attendent encore derrière « Voir plus » */
    restants,
    /** Combien le prochain « Voir plus » en montre */
    prochains: Math.min(parPage, restants),
    /** Plus que les premiers à l'écran : « Replier » a un sens */
    deplie: pagesEnPlus > 0 && elements.length > premiers,
    voirPlus: () => setPagesEnPlus((n) => n + 1),
    replier: () => setPagesEnPlus(0),
  };
}
