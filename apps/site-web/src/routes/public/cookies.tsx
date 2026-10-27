import type { Route } from "./+types/cookies";

import { ReglagesCookies } from "~/composants/cookies/ReglagesCookies";
import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return lireDocumentLegal("cookies", lireLangueRequete(request).langue);
}

/**
 * Page /cookies (contenu dans src/contenus/legal/cookies.ts). Sous « Gérer mes cookies » (#mes-choix), le formulaire des
 * choix, qui marche aussi sans JavaScript, dès qu'une catégorie est active (ou en aperçu, « ?apercu-cookies »).
 */
export default function PageCookies({ loaderData }: Route.ComponentProps) {
  return <DocumentLegal document={loaderData.document} langueDocument={loaderData.langue} complements={{ "mes-choix": <ReglagesCookies /> }} />;
}
