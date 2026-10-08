import type { Route } from "./+types/cgu";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentCgu } from "~/contenus/legal/cgu";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentCgu.titre, description: documentCgu.description });
}

/** Page /cgu (contenu dans src/contenus/legal/cgu.ts). */
export default function PageCgu() {
  return <DocumentLegal document={documentCgu} />;
}
