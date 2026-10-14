import { data } from "react-router";

import type { Route } from "./+types/qr-connexion";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { PAGE_Q } from "~/contenus/connexion-qr";
import { SCHEMA_APP } from "~/contenus/liens-app";
import { lireCodeQr } from "~/fonctions/connexion-qr/lire-code-qr";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Jamais en cache, jamais indexée, et sans « Referer » vers un autre site : le code ne fuit nulle part */
const ENTETES = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };

/**
 * /q/:code (sosmiam.fr) : l'adresse d'un QR de connexion (connexion par QR code, comme Discord). Quand l'app est installée,
 * le lien universel l'ouvre directement ; sinon (QR scanné avec l'appareil photo), cette page : « Ouvre l'app », avec le
 * lien de secours sosmiam://q/<code>. Aucun appel à l'API, rien n'est journalisé ; les statistiques ne reçoivent que « /q »
 * (services/mesure.server.ts). Code mal formé : 404 aimable.
 */
export function loader({ params }: Route.LoaderArgs) {
  const code = lireCodeQr(params.code);
  return data({ code }, { status: code ? 200 : 404, headers: ENTETES });
}

export function headers() {
  return ENTETES;
}

/** Aucune balise ne reprend l'adresse : le code ne peut pas fuiter par un aperçu de lien */
export function meta() {
  return [
    { title: "Connexion avec l'app — SOS Miam" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}

export default function PageQrConnexion({ loaderData }: Route.ComponentProps) {
  const { code } = loaderData;
  return (
    <Section fond="creme" etroit>
      <div className="text-center">
        <p className="mb-4 text-6xl" aria-hidden="true">{code ? "📱" : "🤔"}</p>
        <TitreSection principal chapo={lierPonctuation(code ? PAGE_Q.chapo : PAGE_Q.introuvableChapo)}>
          {lierPonctuation(code ? PAGE_Q.titre : PAGE_Q.introuvableTitre)}
        </TitreSection>
        {code ? (
          <>
            <Bouton href={`${SCHEMA_APP}://q/${code}`}>{lierPonctuation(PAGE_Q.bouton)}</Bouton>
            <p className="mx-auto mt-8 max-w-md text-gris">{lierPonctuation(PAGE_Q.aide)}</p>
          </>
        ) : (
          <Bouton vers="/">{lierPonctuation("Découvrir SOS Miam")}</Bouton>
        )}
      </div>
    </Section>
  );
}
