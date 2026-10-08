import type { Route } from "./+types/accessibilite";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentAccessibilite } from "~/contenus/legal/accessibilite";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentAccessibilite.titre, description: documentAccessibilite.description });
}

/** Page /accessibilite, l'« URL des informations d'accessibilité » de la fiche App Store (contenu dans src/contenus/legal/accessibilite.ts). */
export default function PageAccessibilite() {
  return <DocumentLegal document={documentAccessibilite} />;
}
