import { useCallback, useRef, useState } from "react";
import type { View } from "react-native";

import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";

// Le temps que les nouveaux éléments soient à l'écran avant d'y poser le lecteur d'écran
const DELAI_FOCUS = 250;

/**
 * Montre une longue liste par morceaux : les `premiers` d'abord, puis `parPage` de plus à chaque « Voir plus » (comme les pages
 * que servira l'API). Un élément retiré ne replie rien. Avec `cle` et `refDe` posé sur chaque élément, « Voir plus » amène
 * VoiceOver et TalkBack sur le premier élément ajouté (sinon, il resterait sur le bouton, après les nouveaux).
 */
export function utiliserPagination<T>(elements: readonly T[], premiers: number, parPage: number = premiers, cle?: (element: T) => string) {
  const [pagesEnPlus, setPagesEnPlus] = useState(0);
  const vues = useRef(new Map<string, View>());
  const visibles = elements.slice(0, premiers + pagesEnPlus * parPage);
  const restants = elements.length - visibles.length;

  /** La ref à poser sur l'élément principal (celui qu'on touche) de l'élément `k` */
  const refDe = useCallback(
    (k: string) => (vue: View | null) => {
      if (vue) vues.current.set(k, vue);
      else vues.current.delete(k);
    },
    [],
  );

  return {
    visibles,
    /** Combien attendent encore derrière « Voir plus » */
    restants,
    /** Combien le prochain « Voir plus » en montre */
    prochains: Math.min(parPage, restants),
    voirPlus: () => {
      const premierAjoute = elements[visibles.length];
      setPagesEnPlus((n) => n + 1);
      if (premierAjoute !== undefined && cle) setTimeout(() => deplacerFocusLecteurEcran(vues.current.get(cle(premierAjoute)) ?? null), DELAI_FOCUS);
    },
    refDe,
  };
}
