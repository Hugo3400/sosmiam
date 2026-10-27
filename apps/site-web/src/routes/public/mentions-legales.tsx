import type { Route } from "./+types/mentions-legales";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return lireDocumentLegal("mentions-legales", lireLangueRequete(request).langue);
}

/** Page /mentions-legales (contenu dans src/contenus/legal/mentions-legales.ts). */
export default function PageMentionsLegales({ loaderData }: Route.ComponentProps) {
  return <DocumentLegal document={loaderData.document} langueDocument={loaderData.langue} />;
}
