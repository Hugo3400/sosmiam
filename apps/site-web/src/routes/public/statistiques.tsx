import { redirect } from "react-router";

import type { Route } from "./+types/statistiques";
import { ChoixStatistiques } from "~/composants/legal/ChoixStatistiques";
import { DocumentLegal } from "~/composants/legal/DocumentLegal";
import { documentStatistiques } from "~/contenus/legal/statistiques";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { aRefuseStatistiques, aSignalAntiSuivi, creerCookieRefus } from "~/services/mesure.server";

export function meta(_: Route.MetaArgs) {
  return creerMeta({ titre: documentStatistiques.titre, description: documentStatistiques.description });
}

export function loader({ request }: Route.LoaderArgs) {
  return { refus: aRefuseStatistiques(request), signalNavigateur: aSignalAntiSuivi(request) };
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
      document={documentStatistiques}
      complements={{ "ton-choix": <ChoixStatistiques refus={loaderData.refus} signalNavigateur={loaderData.signalNavigateur} /> }}
    />
  );
}
