import type { Route } from "./+types/cookies";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentCookies } from "~/contenus/legal/cookies";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentCookies.titre, description: documentCookies.description });
}

/** Page /cookies (contenu dans src/contenus/legal/cookies.ts). */
export default function PageCookies() {
  return <DocumentLegal document={documentCookies} />;
}
