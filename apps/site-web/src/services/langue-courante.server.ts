import { AsyncLocalStorage } from "node:async_hooks";

import { ENTETE_LANGUE, LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";

const stock = new AsyncLocalStorage<Langue>();

export function porterLangue<T>(langue: Langue, faire: () => T): T {
  return stock.run(langue, faire);
}

export function lireLangueCourante(): Langue {
  return stock.getStore() ?? LANGUE_PAR_DEFAUT;
}

export function entetesLangue(): Record<string, string> {
  return { [ENTETE_LANGUE]: lireLangueCourante() };
}
