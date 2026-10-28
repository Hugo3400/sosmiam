import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PROPOSITION_LANGUE_ANGLAIS } from "~/contenus/anglais/proposition-langue";

export const TEXTES_PROPOSITION_LANGUE = {
  etiquette: "Autre langue",
  message: "Cette page existe aussi en français.",
  lire: "Lire en français",
  refuser: "Non merci",
};

export const TEXTES_PROPOSITION_LANGUE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROPOSITION_LANGUE>> = {
  fr: TEXTES_PROPOSITION_LANGUE,
  en: TEXTES_PROPOSITION_LANGUE_ANGLAIS,
};
