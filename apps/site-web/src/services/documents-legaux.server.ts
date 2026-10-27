import type { Langue } from "../../../../packages/commun/src/regles/langues.ts";
import { documentMentionsLegales } from "~/contenus/legal/mentions-legales";
import { documentMentionsLegalesAnglais } from "~/contenus/anglais/legal/mentions-legales";
import { documentConfidentialite } from "~/contenus/legal/confidentialite";
import { documentConfidentialiteAnglais } from "~/contenus/anglais/legal/confidentialite";
import { documentCookies } from "~/contenus/legal/cookies";
import { documentCookiesAnglais } from "~/contenus/anglais/legal/cookies";
import { documentCgu } from "~/contenus/legal/cgu";
import { documentCguAnglais } from "~/contenus/anglais/legal/cgu";
import { documentAge } from "~/contenus/legal/age";
import { documentAgeAnglais } from "~/contenus/anglais/legal/age";
import { documentAccessibilite } from "~/contenus/legal/accessibilite";
import { documentAccessibiliteAnglais } from "~/contenus/anglais/legal/accessibilite";
import { documentPrevention } from "~/contenus/legal/prevention";
import { documentPreventionAnglais } from "~/contenus/anglais/legal/prevention";
import { documentStatistiques } from "~/contenus/legal/statistiques";
import { documentStatistiquesAnglais } from "~/contenus/anglais/legal/statistiques";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

export type NomDocumentLegal = "mentions-legales" | "confidentialite" | "cookies" | "cgu" | "age" | "accessibilite" | "prevention" | "statistiques";

export const DOCUMENTS_LEGAUX: Readonly<Record<NomDocumentLegal, { fr: DocumentLegal; en: DocumentLegal | null }>> = {
  "mentions-legales": { fr: documentMentionsLegales, en: documentMentionsLegalesAnglais },
  "confidentialite": { fr: documentConfidentialite, en: documentConfidentialiteAnglais },
  "cookies": { fr: documentCookies, en: documentCookiesAnglais },
  "cgu": { fr: documentCgu, en: documentCguAnglais },
  "age": { fr: documentAge, en: documentAgeAnglais },
  "accessibilite": { fr: documentAccessibilite, en: documentAccessibiliteAnglais },
  "prevention": { fr: documentPrevention, en: documentPreventionAnglais },
  "statistiques": { fr: documentStatistiques, en: documentStatistiquesAnglais },
};

export type DocumentLegalLu = { document: DocumentLegal; langue: Langue };

export function lireDocumentLegal(nom: NomDocumentLegal, langue: Langue): DocumentLegalLu {
  const anglais = langue === "en" ? DOCUMENTS_LEGAUX[nom].en : null;
  return anglais ? { document: anglais, langue: "en" } : { document: DOCUMENTS_LEGAUX[nom].fr, langue: "fr" };
}
