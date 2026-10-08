import type { Route } from "./+types/age";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentAge } from "~/contenus/legal/age";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentAge.titre, description: documentAge.description });
}

/** Page /age, l'« URL d'adéquation à l'âge » de la fiche App Store (contenu dans src/contenus/legal/age.ts). */
export default function PageAge() {
  return <DocumentLegal document={documentAge} />;
}
