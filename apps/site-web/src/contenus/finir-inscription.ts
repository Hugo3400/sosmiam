import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_FINIR_INSCRIPTION_ANGLAIS } from "~/contenus/anglais/finir-inscription";

export const TEXTES_FINIR_INSCRIPTION = {
  titre: "Finir ton inscription",
  description: "Encore trois infos et ton compte SOS Miam est prêt.",
  chapo: "Bienvenue chez les Miamis ! Encore trois petites infos et ton compte SOS Miam est prêt.",
  laisserTomber: "Finalement non, je laisse tomber",
  lieA: (fournisseur: string) => `Ton compte SOS Miam sera lié à ${fournisseur}, avec l'adresse `,
  aideDateNaissance: "SOS Miam, c'est dès 18 ans. Elle est gardée chiffrée avec ton compte, comme pour un compte créé dans l'app.",
  ville: "Ta ville",
  aideVille: "Pour te montrer les lieux du coin dans l'app.",
};

export const TEXTES_FINIR_INSCRIPTION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FINIR_INSCRIPTION>> = {
  fr: TEXTES_FINIR_INSCRIPTION,
  en: TEXTES_FINIR_INSCRIPTION_ANGLAIS,
};
