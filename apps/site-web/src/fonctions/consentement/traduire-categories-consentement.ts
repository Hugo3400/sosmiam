import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { CategorieConsentement, TEXTES_CONSENTEMENT } from "~/contenus/cookies-consentement";

type TextesConsentement = Traduction<typeof TEXTES_CONSENTEMENT>;

export function traduireCategoriesConsentement(categories: CategorieConsentement[], textes: TextesConsentement): CategorieConsentement[] {
  const partenaires: Readonly<Record<string, { readonly nom?: string; readonly role: string }>> = textes.partenaires;
  const traceurs: Readonly<Record<string, { readonly finalite: string; readonly duree: string }>> = textes.traceurs;
  return categories.map((categorie) => ({
    ...categorie,
    ...textes.categories[categorie.id],
    partenaires: categorie.partenaires.map((partenaire) => ({
      ...partenaire,
      ...partenaires[partenaire.nom],
      traceurs: partenaire.traceurs.map((traceur) => ({ ...traceur, ...traceurs[traceur.nom] })),
    })),
  }));
}
