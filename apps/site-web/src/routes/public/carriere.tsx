import { data, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/carriere";

import { EnTeteCarriere } from "~/composants/carriere/EnTeteCarriere";
import { FormulesCarriere } from "~/composants/carriere/FormulesCarriere";
import { ListeOffres } from "~/composants/carriere/ListeOffres";
import { pageCarriere } from "~/contenus/carriere";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { listerOffresCarriere } from "~/services/carriere.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: `${pageCarriere.titre} : bénévoles et freelances`, description: pageCarriere.description });
}

export async function loader({ request }: Route.LoaderArgs) {
  const offres = await listerOffresCarriere(lireIpVisiteur(request));
  return data({ offres }, { status: offres === null ? 503 : 200 });
}

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (!formMethod && currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

export default function PageCarriere({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <EnTeteCarriere />
      <ListeOffres offres={loaderData.offres} />
      <FormulesCarriere />
    </>
  );
}
