import type { Route } from "./+types/confidentialite";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return lireDocumentLegal("confidentialite", lireLangueRequete(request).langue);
}

/** Page /confidentialite (contenu dans src/contenus/legal/confidentialite.ts). */
export default function PageConfidentialite({ loaderData }: Route.ComponentProps) {
  return <DocumentLegal document={loaderData.document} langueDocument={loaderData.langue} />;
}
