import type { Route } from "./+types/prevention";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentPrevention } from "~/contenus/legal/prevention";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentPrevention.titre, description: documentPrevention.description });
}

/** Page /prevention : alcool, route, manger et bouger, numéros d'aide (contenu dans src/contenus/legal/prevention.ts). */
export default function PagePrevention() {
  return <DocumentLegal document={documentPrevention} />;
}
