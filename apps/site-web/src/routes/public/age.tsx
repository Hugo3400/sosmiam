import type { Route } from "./+types/age";

import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return lireDocumentLegal("age", lireLangueRequete(request).langue);
}

/** Page /age, l'« URL d'adéquation à l'âge » de la fiche App Store (contenu dans src/contenus/legal/age.ts). */
export default function PageAge({ loaderData }: Route.ComponentProps) {
  return <DocumentLegal document={loaderData.document} langueDocument={loaderData.langue} />;
}
