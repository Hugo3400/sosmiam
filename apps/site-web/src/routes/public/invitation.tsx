import { useEffect, useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/invitation";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { SCHEMA_APP, STORES_APP } from "~/contenus/liens-app";
import { lireCodeInvitation } from "~/fonctions/liens-app/lire-code-invitation";
import { lirePseudoInvitation } from "~/fonctions/liens-app/lire-pseudo-invitation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
export function meta({ loaderData }: Route.MetaArgs) {
  const pseudo = loaderData?.pseudo;
  const titre = pseudo ? `Rejoins la bande de @${pseudo} — SOS Miam` : "Invitation introuvable — SOS Miam";
  return [
    { title: titre },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
    { property: "og:title", content: titre },
    { property: "og:description", content: "Ouvre SOS Miam pour rejoindre sa bande et sauver des tables ensemble." },
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
  const lienApp = utiliserLienApp(pseudo);
  return (
    <div className="text-center">
      <p className="mb-4 text-6xl" aria-hidden="true">🛟</p>
      <TitreSection principal chapo={lierPonctuation("Une bande, c'est des potes qui sauvent des tables ensemble. Il ne manque plus que toi à bord.")}>
        {lierPonctuation(`Ouvre SOS Miam pour rejoindre la bande de @${pseudo}`)}
      </TitreSection>
      <Bouton href={lienApp}>{lierPonctuation("Ouvrir l'app")}</Bouton>
      <p className="mx-auto mt-8 max-w-md text-gris">
        {lierPonctuation("Pas encore l'app ? Elle est en développement et arrive bientôt sur les stores. Garde ce lien bien au chaud : il marchera dès qu'elle sera là.")}
      </p>
      <ul className="mx-auto mt-4 flex max-w-md flex-col gap-1 text-gris">
        {STORES_APP.map((store) => (
          <li key={store.nom}>
            {store.adresse ? (
              <a href={store.adresse} className="underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">{store.nom}</a>
            ) : (
              lierPonctuation(`${store.nom} : bientôt`)
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La page : l'invitation, ou un mot aimable si l'adresse n'est pas celle d'une invitation */
export default function PageInvitation({ loaderData }: Route.ComponentProps) {
  return (
    <Section fond="creme" etroit>
      {loaderData.pseudo ? (
        <Invitation pseudo={loaderData.pseudo} />
      ) : (
        <div className="text-center">
          <p className="mb-4 text-6xl" aria-hidden="true">🤔</p>
          <TitreSection principal chapo={lierPonctuation("Ce lien d'invitation a dû prendre l'eau en chemin. Demande à ton pote de te le renvoyer, ou de te montrer son QR code dans l'app.")}>
            {lierPonctuation("Invitation introuvable")}
          </TitreSection>
          <Bouton vers="/">{lierPonctuation("Découvrir SOS Miam")}</Bouton>
        </div>
      )}
    </Section>
  );
}
