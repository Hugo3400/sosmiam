import { data, redirect } from "react-router";

import type { Route } from "./+types/qr-vitrine";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_QR_VITRINE_PAR_LANGUE } from "~/contenus/qr-vitrine";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { estCodeVitrine } from "~/fonctions/lieux/est-code-vitrine";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
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

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: choisirTextes(TEXTES_QR_VITRINE_PAR_LANGUE, lireLangueMeta(matches)).titreMeta }, { name: "robots", content: "noindex" }];
}

/** La page aimable : le QR mène bien à un lieu SOS Miam, que l'app retrouvera (aucun lien de store : l'app n'est pas encore publiée). */
export default function PageQrVitrine({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_QR_VITRINE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  return (
    <Section fond="creme" etroit>
      <div className="text-center">
        <p className="mb-4 text-6xl" aria-hidden="true">🛟</p>
        <TitreSection principal chapo={lierPonctuation(T.chapo)}>
          {lierPonctuation(T.titre)}
        </TitreSection>
        {loaderData.indisponible && (
          <p className="mx-auto mb-8 max-w-md text-gris">{lierPonctuation(T.indisponible)}</p>
        )}
        <Bouton vers={lien("/")}>{lierPonctuation(T.decouvrir)}</Bouton>
      </div>
    </Section>
  );
}
