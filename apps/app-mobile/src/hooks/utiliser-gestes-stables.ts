import { useLayoutEffect, useMemo, useRef } from "react";

type Gestes = Record<string, (...args: never[]) => unknown>;

/**
 * Renvoie des fonctions qui restent les mêmes d'un rendu à l'autre, mais appellent toujours leur version la plus récente.
 * Les composants mémorisés qui les reçoivent (les publications du fil) ne se redessinent donc pas à chaque changement de l'écran.
 */
export function utiliserGestesStables<T extends Gestes>(gestes: T): T {
  const recents = useRef(gestes);
  useLayoutEffect(() => {
    recents.current = gestes;
  });
  return useMemo(
    () => Object.fromEntries(Object.keys(recents.current).map((nom) => [nom, (...args: never[]) => recents.current[nom](...args)])) as T,
    [],
  );
}
