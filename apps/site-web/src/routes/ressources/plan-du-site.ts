import type { Route } from "./+types/plan-du-site";

import { site } from "~/contenus/legal/informations-legales";
import { pagesIndexees } from "~/contenus/plan-du-site";
import { construirePlanDuSite, type AdressePlan } from "~/fonctions/seo/construire-plan-du-site";
import { LANGUES_OUVERTES_SITE } from "../../../../../packages/commun/src/regles/langues.ts";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { LIEUX_NON_INDEXES } from "~/contenus/lieux-non-indexes";
import { listerArticlesActus } from "~/services/actus.server";
import { listerOffresCarriere } from "~/services/carriere.server";
import { listerLieuxDuPlan } from "~/services/lieux.server";

function enDeuxLangues(origine: string, chemin: string, modifieLe?: string): AdressePlan[] {
  if (!LANGUES_OUVERTES_SITE.includes("en")) return [{ adresse: `${origine}${chemin}`, modifieLe }];
  const francais = `${origine}${chemin}`;
  const anglais = `${origine}${ecrireCheminLangue(chemin, "en")}`;
  const alternatives = [{ langue: "fr", adresse: francais }, { langue: "en", adresse: anglais }, { langue: "x-default", adresse: francais }];
  return [{ adresse: francais, modifieLe, alternatives }, { adresse: anglais, modifieLe, alternatives }];
}

/**
 * GET /sitemap.xml : la liste des pages publiques, pour les moteurs de recherche (contenu dans src/contenus/plan-du-site.ts).
 * Sur l'espace ambassadeur, une seule page publique : le programme ; sur l'espace pro, /bienvenue. Sur sosmiam.fr, en plus,
 * la fiche de chaque lieu PUBLIÉ (https://sosmiam.fr/lieux/:id, avec <lastmod> : sa dernière modification), lue à l'API
 * (GET /lieux/plan). Cache de 5 minutes (une heure sur les espaces) ; si l'API ne répond pas, le plan part sans les fiches, avec un cache d'une minute.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const hote = new URL(request.url).hostname;
  let adresses: AdressePlan[];
  let cache = "public, max-age=3600";
  if (hote === HOTE_AMBASSADEUR) adresses = enDeuxLangues(`https://${HOTE_AMBASSADEUR}`, "/programme");
  else if (hote === HOTE_PRO) adresses = enDeuxLangues(`https://${HOTE_PRO}`, "/bienvenue");
  else {
    cache = "public, max-age=300";
    const [lieux, offres, actus] = await Promise.all([listerLieuxDuPlan(), listerOffresCarriere(null, 2000), listerArticlesActus({ rubrique: null, ville: null, curseur: null }, null)]);
    if (lieux === null || offres === null) cache = "public, max-age=60";
    adresses = [
      ...pagesIndexees.flatMap((chemin) => enDeuxLangues(`https://${site.adresse}`, chemin)),
      ...(offres ?? []).flatMap(({ id, publieeLe }) => enDeuxLangues(`https://${site.adresse}`, `/carriere/${id}`, publieeLe)),
      ...(actus.ok ? actus.donnees.articles : []).map(({ id, publieLe }) => ({ adresse: `https://${site.adresse}/actus/${id}`, modifieLe: publieLe })),
      ...(lieux ?? []).filter(({ id, indexable }) => indexable === true && !LIEUX_NON_INDEXES.has(id)).map(({ id, modifieLe }) => ({ adresse: `https://${site.adresse}/lieux/${id}`, modifieLe })),
    ];
  }
  return new Response(construirePlanDuSite(adresses), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": cache },
  });
}
