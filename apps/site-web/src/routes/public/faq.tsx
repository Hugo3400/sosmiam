import type { Route } from "./+types/faq";

import { Faq } from "~/composants/faq/Faq";
import { TitreSection } from "~/composants/interface/TitreSection";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { Section } from "~/composants/mise-en-page/Section";
import { ongletsFaq } from "~/contenus/faq/onglets-faq";
import { creerDonneesFaq } from "~/fonctions/seo/creer-donnees-faq";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "Questions fréquentes",
    description: "Rescousses, BIG SOS, inscription des lieux, ambassadeurs : toutes les réponses sur SOS Miam, l'app des lieux indépendants qui ont besoin de monde.",
  });
}

/** Page /faq : toutes les questions, par thème, avec recherche (toutes rendues côté serveur : la FAQPage les reprend). */
export default function PageFaq() {
  return (
    <Section fond="creme" etroit>
      <DonneesStructurees donnees={creerDonneesFaq(ongletsFaq)} />
      <TitreSection principal chapo="Tout ce que tu veux savoir avant de sauver ta première table.">Questions fréquentes</TitreSection>
      <Faq onglets={ongletsFaq} />
    </Section>
  );
}
