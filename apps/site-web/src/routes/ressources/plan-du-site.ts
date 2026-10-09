import type { Route } from "./+types/plan-du-site";

import { site } from "~/contenus/legal/informations-legales";
import { pagesIndexees } from "~/contenus/plan-du-site";
import { construirePlanDuSite, type AdressePlan } from "~/fonctions/seo/construire-plan-du-site";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { listerLieuxDuPlan } from "~/services/lieux.server";

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
  if (hote === HOTE_AMBASSADEUR) adresses = [{ adresse: `https://${HOTE_AMBASSADEUR}/programme` }];
  else if (hote === HOTE_PRO) adresses = [{ adresse: `https://${HOTE_PRO}/bienvenue` }];
  else {
    cache = "public, max-age=300";
    const lieux = await listerLieuxDuPlan();
    if (lieux === null) cache = "public, max-age=60";
    adresses = [
      ...pagesIndexees.map((chemin) => ({ adresse: `https://${site.adresse}${chemin}` })),
      ...(lieux ?? []).map(({ id, modifieLe }) => ({ adresse: `https://${site.adresse}/lieux/${id}`, modifieLe })),
    ];
  }
  return new Response(construirePlanDuSite(adresses), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": cache },
  });
}
