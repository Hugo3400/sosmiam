import type { CSSProperties } from "react";
import { Link, redirect } from "react-router";

import type { Route } from "./+types/carte-de-visite";
import { CarteVisiteAmbassadeur } from "~/composants/ambassadeur/CarteVisiteAmbassadeur";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

/** Une face de 510 px pour 85 mm (321 px à 96 points par pouce) : le zoom l'amène au format, un poil en dessous */
const ZOOM_IMPRESSION = 0.6295;

export function meta(_: Route.MetaArgs) {
  return [{ title: "Ma carte de visite — SOS Miam" }, { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

/** Réservée aux ambassadeurs certifiés (comme le kit pro) : leur prénom et leur ville. */
export async function loader({ request }: Route.LoaderArgs) {
  const { compte } = await exigerAmbassadeurActif(request);
  if (!compte.ambassadeur?.certifie) throw redirect("/espace/certification");
  return { prenom: compte.prenom, ville: compte.ambassadeur.ville };
}

/**
 * Page /espace/carte-de-visite : la carte de visite d'ambassadeur certifié (maquette validée par Hugo), à ton prénom et ta
 * ville. À l'impression, deux pages de 85 × 55 mm : le recto, puis le verso (un PDF prêt pour l'imprimeur).
 */
export default function PageCarteDeVisite({ loaderData }: Route.ComponentProps) {
  const { prenom, ville } = loaderData;
  return (
    <article className="mx-auto w-[min(1120px,100%-32px)] py-10 md:py-14 print:w-auto print:p-0">
      <style>{"@page { size: 85mm 55mm; margin: 0; }"}</style>
      <div className="print:hidden">
        <Link to="/espace/kit-media-pro" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
          <span aria-hidden="true">←</span> Mon kit média pro
        </Link>
        <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-tight">Ma carte de visite</h1>
        <p className="mt-3 max-w-2xl text-lg text-gris">
          {lierPonctuation("À laisser au comptoir quand tu présentes SOS Miam à un lieu : ton prénom, ta ville, et un QR vers « J'inscris mon lieu ».")}
        </p>
        <ul className="mt-6 mb-8 grid max-w-2xl list-disc gap-1.5 pl-5 text-gris">
          <li>{lierPonctuation("Format 85 × 55 mm, recto verso : « Enregistrer au format PDF », puis envoie le fichier à un imprimeur en ligne.")}</li>
          <li>{lierPonctuation("Ton prénom et ta ville viennent de ton compte : change-les dans « Mon compte » si besoin.")}</li>
        </ul>
        <BoutonImprimer libelle="Imprimer ma carte" />
      </div>
      <div className="mt-10 flex flex-wrap gap-6 print:mt-0 print:block">
        {(["recto", "verso"] as const).map((face) => (
          <div
            key={face}
            className="w-max [zoom:0.6] sm:[zoom:0.9] print:break-after-page print:[zoom:var(--zoom-impression)]"
            style={{ "--zoom-impression": ZOOM_IMPRESSION } as CSSProperties}
          >
            <CarteVisiteAmbassadeur face={face} prenom={prenom} ville={ville} />
          </div>
        ))}
      </div>
    </article>
  );
}
