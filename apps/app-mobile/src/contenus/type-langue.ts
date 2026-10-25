import type { Langue } from "@sos-miam/commun/regles/langues";

export type ReglageLangue = "automatique" | Langue;

export const REGLAGES_LANGUE: readonly ReglageLangue[] = ["automatique", "fr", "en"];
