import type { Route } from "./+types/mentions-legales";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentMentionsLegales } from "~/contenus/legal/mentions-legales";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentMentionsLegales.titre, description: documentMentionsLegales.description });
}

/** Page /mentions-legales (contenu dans src/contenus/legal/mentions-legales.ts). */
export default function PageMentionsLegales() {
  return <DocumentLegal document={documentMentionsLegales} />;
}
