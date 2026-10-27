import { useEffect, useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/invitation";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_INVITATION_PAR_LANGUE } from "~/contenus/invitation";
import { SCHEMA_APP, STORES_APP } from "~/contenus/liens-app";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { lireCodeInvitation } from "~/fonctions/liens-app/lire-code-invitation";
import { lirePseudoInvitation } from "~/fonctions/liens-app/lire-pseudo-invitation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Jamais en cache (l'adresse peut porter l'ancien « ?c= »), jamais indexée, et sans « Referer » vers un autre site */
const ENTETES = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };

/**
 * /invitation/:pseudo : le lien d'invitation d'un pote (QR code ou lien partagé depuis l'app). Quand l'app est installée,
 * le lien universel l'ouvre directement ; sinon, cette page. Le code secret est dans le fragment (« #c=… ») : il n'arrive
 * jamais au serveur, qui n'en a pas besoin. L'ancien « ?c=… » est accepté mais jamais lu ici, ni affiché, ni renvoyé
 * (statistiques : services/mesure.server.ts ne garde que « /invitation »). Aucun appel à l'API. Pseudo mal formé : 404 aimable.
 */
export function loader({ params }: Route.LoaderArgs) {
  const pseudo = lirePseudoInvitation(params.pseudo);
  return data({ pseudo }, { status: pseudo ? 200 : 404, headers: ENTETES });
}

export function headers() {
  return ENTETES;
}

/** Aucune balise ne reprend l'adresse : le code ne peut pas fuiter par un aperçu de lien */
export function meta({ loaderData, matches }: Route.MetaArgs) {
  const T = choisirTextes(TEXTES_INVITATION_PAR_LANGUE, lireLangueMeta(matches?.flatMap((correspondance) => (correspondance ? [correspondance] : [])))).meta;
  const pseudo = loaderData?.pseudo;
  const titre = pseudo ? T.titre(pseudo) : T.introuvable;
  return [
    { title: titre },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
    { property: "og:title", content: titre },
    { property: "og:description", content: T.description },
  ];
}

/** Le lien de secours vers l'app, avec le code du fragment s'il y en a un (lu dans le navigateur, jamais par le serveur) */
function utiliserLienApp(pseudo: string): string {
  const [lien, changerLien] = useState(`${SCHEMA_APP}://invitation/${pseudo}`);
  useEffect(() => {
    const code = lireCodeInvitation(window.location.hash, window.location.search);
    // Ancien lien « ?c=… » : le code passe dans le fragment, il ne reste ni dans l'historique ni dans une adresse rechargée
    if (new URLSearchParams(window.location.search).has("c")) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${code ? `#c=${code}` : ""}`);
    }
    changerLien(`${SCHEMA_APP}://invitation/${pseudo}${code ? `#c=${code}` : ""}`);
  }, [pseudo]);
  return lien;
}

function Invitation({ pseudo }: { pseudo: string }) {
  const T = utiliserTextes(TEXTES_INVITATION_PAR_LANGUE);
  const lienApp = utiliserLienApp(pseudo);
  return (
    <div className="text-center">
      <p className="mb-4 text-6xl" aria-hidden="true">🛟</p>
      <TitreSection principal chapo={lierPonctuation(T.chapo)}>
        {lierPonctuation(T.titre(pseudo))}
      </TitreSection>
      <Bouton href={lienApp}>{lierPonctuation(T.ouvrirApp)}</Bouton>
      <p className="mx-auto mt-8 max-w-md text-gris">
        {lierPonctuation(T.pasEncore)}
      </p>
      <ul className="mx-auto mt-4 flex max-w-md flex-col gap-1 text-gris">
        {STORES_APP.map((store) => (
          <li key={store.nom}>
            {store.adresse ? (
              <a href={store.adresse} className="underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">{store.nom}</a>
            ) : (
              lierPonctuation(T.bientot(store.nom))
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La page : l'invitation, ou un mot aimable si l'adresse n'est pas celle d'une invitation */
export default function PageInvitation({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_INVITATION_PAR_LANGUE);
  const lien = utiliserLienLangue();
  return (
    <Section fond="creme" etroit>
      {loaderData.pseudo ? (
        <Invitation pseudo={loaderData.pseudo} />
      ) : (
        <div className="text-center">
          <p className="mb-4 text-6xl" aria-hidden="true">🤔</p>
          <TitreSection principal chapo={lierPonctuation(T.introuvable.chapo)}>
            {lierPonctuation(T.introuvable.titre)}
          </TitreSection>
          <Bouton vers={lien("/")}>{lierPonctuation(T.decouvrir)}</Bouton>
        </div>
      )}
    </Section>
  );
}
