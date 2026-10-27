import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_META_PARTAGE_ANGLAIS } from "~/contenus/anglais/meta-partage";

export const TEXTES_META_PARTAGE = {
  locale: "fr_FR",
  imageAlt: "SOS Miam : sauve une table, régale-toi. La bouée mascotte sourit sur fond jaune.",
};

export const TEXTES_META_PARTAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_META_PARTAGE>> = {
  fr: TEXTES_META_PARTAGE,
  en: TEXTES_META_PARTAGE_ANGLAIS,
};
