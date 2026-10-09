import { data, redirect } from "react-router";

import type { Route } from "./+types/qr-vitrine";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { estCodeVitrine } from "~/fonctions/lieux/est-code-vitrine";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { trouverLieuParCode } from "~/services/lieux.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

/**
 * /l/:code : le QR de vitrine d'un lieu (imprimé par le logiciel de gestion, construireLienLieu de packages/commun), scanné
 * avec l'appareil photo. Lieu publié → 302 vers sa fiche /lieux/:id ; code inconnu ou lieu pas (ou plus) publié → une
 * petite page aimable, noindex, en 404 (503 si l'API ne répond pas) ; code mal formé → « Page introuvable » (404).
 * Jamais en cache : un lieu peut être publié ou masqué à tout moment. /l/ est fermé aux moteurs (robots.txt).
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  if (!estCodeVitrine(params.code)) throw data(null, { status: 404 });
  const lieu = await trouverLieuParCode(params.code, lireIpVisiteur(request));
  if (lieu.ok) return redirect(`/lieux/${lieu.lieuId}`, { headers: { "Cache-Control": "no-store" } });
  return data({ indisponible: lieu.erreur === "indisponible" }, { status: lieu.erreur === "indisponible" ? 503 : 404, headers: { "Cache-Control": "no-store" } });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export function meta() {
  return [{ title: "Un lieu SOS Miam — SOS Miam" }, { name: "robots", content: "noindex" }];
}

/** La page aimable : le QR mène bien à un lieu SOS Miam, que l'app retrouvera (aucun lien de store : l'app n'est pas encore publiée). */
export default function PageQrVitrine({ loaderData }: Route.ComponentProps) {
  return (
    <Section fond="creme" etroit>
      <div className="text-center">
        <p className="mb-4 text-6xl" aria-hidden="true">🛟</p>
        <TitreSection principal chapo={lierPonctuation("Ouvre l'app SOS Miam pour le retrouver : il t'y attend, promis.")}>
          {lierPonctuation("Ce QR mène à un lieu SOS Miam")}
        </TitreSection>
        {loaderData.indisponible && (
          <p className="mx-auto mb-8 max-w-md text-gris">{lierPonctuation("Petit souci de notre côté : réessaie dans un instant, la fiche sera peut-être là.")}</p>
        )}
        <Bouton vers="/">{lierPonctuation("Découvrir SOS Miam")}</Bouton>
      </div>
    </Section>
  );
}
