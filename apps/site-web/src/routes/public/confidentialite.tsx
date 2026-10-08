import type { Route } from "./+types/confidentialite";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentConfidentialite } from "~/contenus/legal/confidentialite";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentConfidentialite.titre, description: documentConfidentialite.description });
}

/** Page /confidentialite (contenu dans src/contenus/legal/confidentialite.ts). */
export default function PageConfidentialite() {
  return <DocumentLegal document={documentConfidentialite} />;
}
