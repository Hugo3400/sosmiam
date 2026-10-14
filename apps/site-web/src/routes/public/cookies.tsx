import type { Route } from "./+types/cookies";

import { ReglagesCookies } from "~/composants/cookies/ReglagesCookies";
import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentCookies } from "~/contenus/legal/cookies";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentCookies.titre, description: documentCookies.description });
}

/**
 * Page /cookies (contenu dans src/contenus/legal/cookies.ts). Sous « Gérer mes cookies » (#mes-choix), le formulaire des
 * choix, qui marche aussi sans JavaScript, dès qu'une catégorie est active (ou en aperçu, « ?apercu-cookies »).
 */
export default function PageCookies() {
  return <DocumentLegal document={documentCookies} complements={{ "mes-choix": <ReglagesCookies /> }} />;
}
