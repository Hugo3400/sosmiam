import { data } from "react-router";

import type { Route } from "./+types/actus";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { EncartAmbassadeurActus } from "~/composants/actus/EncartAmbassadeurActus";
import { FiltresActus } from "~/composants/actus/FiltresActus";
import { ListeArticlesActus } from "~/composants/actus/ListeArticlesActus";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lireFiltresActus } from "~/fonctions/actus/lire-filtres-actus";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { listerArticlesActus } from "~/services/actus.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import type { PageActus } from "~/types/actus";

const PAGE_VIDE: PageActus = { articles: [], villes: [], suivant: null };

export async function loader({ request }: Route.LoaderArgs) {
  const adresse = new URL(request.url);
  const filtres = lireFiltresActus(adresse.searchParams);
  const { langue } = lireLangueRequete(request);
  const page = await listerArticlesActus(filtres, lireIpVisiteur(request));
  if (!page.ok) return data({ filtres, ...PAGE_VIDE, indisponible: true, langue }, { status: 503 });
  return { filtres, ...page.donnees, indisponible: false, langue };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const langue = loaderData?.langue ?? LANGUE_PAR_DEFAUT;
  const T = choisirTextes(TEXTES_ACTUS_PAR_LANGUE, langue);
  return creerMeta({ titre: T.meta.titre, description: T.meta.description, langue });
}

export default function PageActus({ loaderData }: Route.ComponentProps) {
  const { filtres, articles, villes, suivant, indisponible } = loaderData;
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      <TitreSection principal aGauche chapo={lierPonctuation(T.chapo)}>{T.titre}</TitreSection>
      <div className="-mt-6 flex flex-col gap-8">
        {!indisponible && <FiltresActus filtres={filtres} villes={villes} />}
        <ListeArticlesActus filtres={filtres} articles={articles} suivant={suivant} indisponible={indisponible} />
        <EncartAmbassadeurActus />
      </div>
    </Section>
  );
}
