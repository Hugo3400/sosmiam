import type { Route } from "./+types/accessibilite";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return lireDocumentLegal("accessibilite", lireLangueRequete(request).langue);
}

/** Page /accessibilite, l'« URL des informations d'accessibilité » de la fiche App Store (contenu dans src/contenus/legal/accessibilite.ts). */
export default function PageAccessibilite({ loaderData }: Route.ComponentProps) {
  return <DocumentLegal document={loaderData.document} langueDocument={loaderData.langue} />;
}
