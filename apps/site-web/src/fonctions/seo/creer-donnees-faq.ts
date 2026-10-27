import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { OngletFaq } from "~/contenus/faq/type-faq";
import { convertirBlocsEnTexte } from "~/fonctions/texte/convertir-blocs-en-texte";

/** Données structurées « FAQPage » (schema.org) : aident les moteurs de recherche à lire la FAQ. */
export function creerDonneesFaq(onglets: OngletFaq[], langue: Langue) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: langue,
    mainEntity: onglets.flatMap((onglet) => onglet.questions).map((question) => ({
      "@type": "Question",
      name: question.question,
      acceptedAnswer: { "@type": "Answer", text: convertirBlocsEnTexte(question.reponse) },
    })),
  };
}
