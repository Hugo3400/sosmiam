import type { Route } from "./+types/faq";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Faq } from "~/composants/faq/Faq";
import { TitreSection } from "~/composants/interface/TitreSection";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_PAGE_FAQ_PAR_LANGUE } from "~/contenus/faq/page-faq";
import { listerOngletsFaq } from "~/fonctions/faq/lister-onglets-faq.server";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerDonneesFaq } from "~/fonctions/seo/creer-donnees-faq";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";

export function loader({ request }: Route.LoaderArgs) {
  return { onglets: listerOngletsFaq(lireLangueRequete(request).langue) };
}

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches.flatMap((correspondance) => (correspondance ? [correspondance] : [])));
  const T = choisirTextes(TEXTES_PAGE_FAQ_PAR_LANGUE, langue);
  return creerMeta({ titre: T.titre, description: T.description, langue });
}

/** Page /faq : toutes les questions, par thème, avec recherche (toutes rendues côté serveur : la FAQPage les reprend). */
export default function PageFaq({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_PAGE_FAQ_PAR_LANGUE);
  const langue = utiliserLangue();
  return (
    <Section fond="creme" etroit>
      <DonneesStructurees donnees={creerDonneesFaq(loaderData.onglets, langue)} />
      <TitreSection principal chapo={T.chapo}>{T.titre}</TitreSection>
      <Faq onglets={loaderData.onglets} />
    </Section>
  );
}
