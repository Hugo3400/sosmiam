import { redirect } from "react-router";

import type { Route } from "./+types/statistiques";
import { ChoixStatistiques } from "~/composants/legal/ChoixStatistiques";
import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireDocumentLegal } from "~/services/documents-legaux.server";
import { lireLangueRequete } from "~/services/langue.server";
import { aRefuseStatistiques, aSignalAntiSuivi, creerCookieRefus } from "~/services/mesure.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const document = loaderData?.document;
  return document ? creerMeta({ titre: document.titre, description: document.description, langue: loaderData.langue }) : [];
}

export function loader({ request }: Route.LoaderArgs) {
  return { ...lireDocumentLegal("statistiques", lireLangueRequete(request).langue), refus: aRefuseStatistiques(request), signalNavigateur: aSignalAntiSuivi(request) };
}

/** Enregistre le choix (cookie de refus, ou son effacement), puis revient sur la page. */
export async function action({ request }: Route.ActionArgs) {
  const choix = (await request.formData()).get("choix");
  return redirect("/statistiques", { headers: { "Set-Cookie": creerCookieRefus(choix === "refuser") } });
}

/** Page /statistiques : ce qu'on compte, et le bouton pour ne plus compter ses visites (contenu dans src/contenus/legal/statistiques.ts). */
export default function PageStatistiques({ loaderData }: Route.ComponentProps) {
  return (
    <DocumentLegal
      document={loaderData.document}
      langueDocument={loaderData.langue}
      complements={{ "ton-choix": <ChoixStatistiques refus={loaderData.refus} signalNavigateur={loaderData.signalNavigateur} /> }}
    />
  );
}
