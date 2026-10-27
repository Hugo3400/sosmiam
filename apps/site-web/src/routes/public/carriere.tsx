import { data, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/carriere";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { EnTeteCarriere } from "~/composants/carriere/EnTeteCarriere";
import { FormulesCarriere } from "~/composants/carriere/FormulesCarriere";
import { ListeOffres } from "~/composants/carriere/ListeOffres";
import { TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { listerOffresCarriere } from "~/services/carriere.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches?.flatMap((correspondance) => (correspondance ? [correspondance] : [])));
  const T = choisirTextes(TEXTES_CARRIERE_PAR_LANGUE, langue);
  return creerMeta({ titre: T.titreMeta, description: T.description, langue });
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
