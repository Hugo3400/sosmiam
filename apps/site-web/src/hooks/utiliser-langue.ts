import { useRouteLoaderData } from "react-router";

import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";

type DonneesRacine = { langue?: Langue; languesServies?: readonly Langue[] };

export function utiliserLangue(): Langue {
  return useRouteLoaderData<DonneesRacine>("root")?.langue ?? LANGUE_PAR_DEFAUT;
}

export function utiliserLanguesServies(): readonly Langue[] {
  return useRouteLoaderData<DonneesRacine>("root")?.languesServies ?? [LANGUE_PAR_DEFAUT];
}
