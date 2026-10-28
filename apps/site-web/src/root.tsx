import { data, isRouteErrorResponse, Links, Meta, Outlet, redirect, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import type { ReactNode } from "react";

import type { Route } from "./+types/root";
import { utiliserFocusApresNavigation } from "~/hooks/utiliser-focus-apres-navigation";
import { utiliserNonce } from "~/hooks/utiliser-nonce";
import { GestionnaireConsentement } from "~/composants/cookies/GestionnaireConsentement";
import { PropositionLangue } from "~/composants/mise-en-page/PropositionLangue";
import { TEXTES_ERREUR_RACINE_PAR_LANGUE } from "~/contenus/erreur-racine";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { ContexteLangue, utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { Mascotte } from "~/composants/marque/Mascotte";
import { choisirRedirectionHote } from "~/fonctions/hotes/choisir-redirection-hote";
import { lireEtatConsentement } from "~/services/consentement.server";
import { lireLangueRequete } from "~/services/langue.server";
import { porterLangue } from "~/services/langue-courante.server";
import { signalerVue } from "~/services/mesure.server";
// Polices hébergées par le site lui-même (pas d'appel à Google Fonts)
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./styles/app.css";

// Icônes tirées du kit de marque : SVG pour les navigateurs récents, .ico pour les autres, PNG de 192 px (un multiple de 48,
// comme le demande Google pour l'icône de ses résultats), PNG pour l'écran d'accueil iOS, et le manifeste du site
export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/icones/favicon.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/icones/favicon-192.png", type: "image/png", sizes: "192x192" },
  { rel: "apple-touch-icon", href: "/icones/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export const middleware: Route.MiddlewareFunction[] = [
  // sosmiam.fr et ambassadeur.sosmiam.fr se partagent les adresses (voir fonctions/hotes/choisir-redirection-hote.ts).
  // « url » est l'adresse demandée sans les détails de React Router (« .data », « _routes ») : une navigation dans le
  // site est renvoyée vers la page elle-même.
  ({ url }) => {
    const redirection = choisirRedirectionHote(url.hostname, `${url.pathname}${url.search}`);
    if (redirection) throw redirect(redirection.adresse, redirection.statut);
  },
  async ({ request }, suite) => {
    const { langue, servie, negociee, proposition } = lireLangueRequete(request);
    if (!servie) throw data(null, { status: 404 });
    const reponse = await porterLangue(langue, suite);
    if ((negociee || proposition.evaluee) && reponse instanceof Response) reponse.headers.append("Vary", "Accept-Language, Cookie");
    return reponse;
  },
  // Statistiques de visite, sans cookie : chaque page servie est signalée à l'API (voir services/mesure.server.ts)
  async ({ request }, suite) => {
    const debut = performance.now();
    const reponse = await suite();
    if (reponse instanceof Response) signalerVue(request, reponse, performance.now() - debut);
    return reponse;
  },
];

/**
 * Consentement aux cookies, lu à chaque page par le serveur (premier affichage sans clignotement du bandeau) : aperçu ou
 * pas, et le choix du cookie « sosmiam-consentement » (services/consentement.server.ts).
 */
export function loader({ request }: Route.LoaderArgs) {
  const { langue, servies, proposition } = lireLangueRequete(request);
  return { consentement: lireEtatConsentement(request), langue, languesServies: servies, langueProposee: proposition.proposee };
}

export function Layout({ children }: { children: ReactNode }) {
  const nonce = utiliserNonce();
  const racine = useRouteLoaderData<typeof loader>("root");
  const langue = racine?.langue ?? "fr";
  const servies = racine?.languesServies ?? ["fr"];
  return (
    <html lang={langue}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFD60A" />
        <Meta />
        <Links nonce={nonce} />
      </head>
      <body>
        <ContexteLangue value={{ langue, servies }}>{children}</ContexteLangue>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // Changement de page sans rechargement : le focus va au titre de la nouvelle page
  utiliserFocusApresNavigation();
  // Bandeau et réglages des cookies sur toutes les pages, des trois hôtes (caché tant qu'aucune catégorie n'est active)
  return (
    <GestionnaireConsentement etat={loaderData.consentement}>
      {loaderData.langueProposee && <PropositionLangue proposee={loaderData.langueProposee} />}
      <Outlet />
    </GestionnaireConsentement>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const T = utiliserTextes(TEXTES_ERREUR_RACINE_PAR_LANGUE);
  const langue = utiliserLangue();
  let { titre, details } = T.erreur;
  let pile: string | undefined;

  if (isRouteErrorResponse(error) && error.status === 404) {
    ({ titre, details } = T.introuvable);
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    pile = error.stack;
  }

  return (
    <>
      <title>{`${titre}${T.suffixeTitre}`}</title>
      <meta name="robots" content="noindex" />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 px-4">
        <Mascotte expression="surprise" className="h-28 w-28" />
        <h1 className="text-4xl font-extrabold">{titre}</h1>
        <p className="text-gris">{details}</p>
        <a href={ecrireCheminLangue("/", langue)} className="rounded-full border-2 border-encre bg-jaune px-6 py-3 font-semibold shadow-brut">
          {T.retour}
        </a>
        {pile && <pre className="w-full overflow-x-auto rounded-xl bg-creme p-4 text-xs"><code>{pile}</code></pre>}
      </main>
    </>
  );
}
