import type { Langue } from "../../../../packages/commun/src/regles/langues.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CHOIX_LANGUE_ANGLAIS } from "~/contenus/anglais/choix-langue";

export const NOMS_LANGUES: Readonly<Record<Langue, string>> = { fr: "Français", en: "English" };

export const TEXTES_CHOIX_LANGUE = {
  etiquette: "Langue du site",
};

export const TEXTES_CHOIX_LANGUE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHOIX_LANGUE>> = {
  fr: TEXTES_CHOIX_LANGUE,
  en: TEXTES_CHOIX_LANGUE_ANGLAIS,
};
