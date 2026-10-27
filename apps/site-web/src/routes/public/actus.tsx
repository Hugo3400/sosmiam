import { data } from "react-router";

import type { Route } from "./+types/actus";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { AucunArticleActus } from "~/composants/actus/AucunArticleActus";
import { CarteArticleActus } from "~/composants/actus/CarteArticleActus";
import { EncartAmbassadeurActus } from "~/composants/actus/EncartAmbassadeurActus";
import { FiltresActus } from "~/composants/actus/FiltresActus";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lireFiltresActus } from "~/fonctions/actus/lire-filtres-actus";
import { estHoteDEssai } from "~/fonctions/hotes/est-hote-d-essai";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { listerArticlesActus } from "~/services/actus.server";
import { lireLangueRequete } from "~/services/langue.server";

export async function loader({ request }: Route.LoaderArgs) {
  const adresse = new URL(request.url);
  if (!estHoteDEssai(adresse.host)) throw data(null, { status: 404 });
  const filtres = lireFiltresActus(adresse.searchParams);
  const { articles, villes } = await listerArticlesActus(filtres);
  return { filtres, articles, villes, langue: lireLangueRequete(request).langue };
}

export function headers() {
  return { "X-Robots-Tag": "noindex" };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const T = choisirTextes(TEXTES_ACTUS_PAR_LANGUE, loaderData?.langue ?? LANGUE_PAR_DEFAUT);
  return [...creerMeta({ titre: T.meta.titre, description: T.meta.description }), { name: "robots", content: "noindex" }];
}

export default function PageActus({ loaderData }: Route.ComponentProps) {
  const { filtres, articles, villes } = loaderData;
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      <TitreSection principal aGauche chapo={lierPonctuation(T.chapo)}>{T.titre}</TitreSection>
      <div className="-mt-6 flex flex-col gap-8">
        <FiltresActus filtres={filtres} villes={villes} />
        <section aria-labelledby="titre-liste-actus" className="flex flex-col gap-4">
          <h2 id="titre-liste-actus" className="sr-only">{T.liste}</h2>
          <p aria-live="polite" className="text-sm font-semibold text-gris">{T.compte(articles.length)}</p>
          {articles.length > 0 ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <CarteArticleActus article={article} />
                </li>
              ))}
            </ul>
          ) : (
            <AucunArticleActus />
          )}
        </section>
        <EncartAmbassadeurActus />
      </div>
    </Section>
  );
}
