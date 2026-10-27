import { useLocation, useRouteLoaderData } from "react-router";

import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";
import { lireLangueChemin } from "~/fonctions/langue/lire-langue-chemin";

type DonneesRacine = { langue?: Langue; languesServies?: readonly Langue[] };

export function utiliserLangue(): Langue {
  const racine = useRouteLoaderData<DonneesRacine>("root");
  const { pathname } = useLocation();
  return racine?.langue ?? lireLangueChemin(pathname).langue ?? LANGUE_PAR_DEFAUT;
}

export function utiliserLanguesServies(): readonly Langue[] {
  return useRouteLoaderData<DonneesRacine>("root")?.languesServies ?? [LANGUE_PAR_DEFAUT];
}
