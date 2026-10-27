import { TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/courriel-confirmation-newsletter.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { formaterDateCourriel } from "../courriels/formater-date-courriel.ts";
import { habillerCourriel } from "../courriels/habiller-courriel.ts";

export function composerCourrielConfirmation({ lien, expireLe, source, langue }: { lien: string; expireLe: Date; source: string; langue: Langue }) {
  const T = choisirTextes(TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_PAR_LANGUE, langue);
  return {
    objet: T.objet,
    ...habillerCourriel({
      titre: T.titre,
      paragraphes: [...T.paragraphes(formaterDateCourriel(expireLe, "echeance", langue))],
      bouton: { texte: T.bouton, adresse: lien },
      pied: source === "app" ? T.pieds.app : T.pieds.site,
      langue,
    }),
  };
}
