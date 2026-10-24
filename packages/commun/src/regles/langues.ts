export const LANGUES = ["fr", "en"] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = "fr";

export const LANGUES_OUVERTES_APP: readonly Langue[] = ["fr"];

export const LANGUES_OUVERTES_SITE: readonly Langue[] = ["fr"];

export const ENTETE_LANGUE = "X-Langue";

export const COOKIE_LANGUE = "sosmiam-langue";

export const PARAMETRE_LANGUE = "langue";
