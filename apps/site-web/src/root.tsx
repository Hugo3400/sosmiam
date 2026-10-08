import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { ReactNode } from "react";

import type { Route } from "./+types/root";
import { utiliserFocusApresNavigation } from "~/hooks/utiliser-focus-apres-navigation";
import { Mascotte } from "~/composants/marque/Mascotte";
import { signalerVue } from "~/services/mesure.server";
// Polices hébergées par le site lui-même (pas d'appel à Google Fonts)
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./styles/app.css";

// Icônes tirées du kit de marque : SVG pour les navigateurs récents, .ico pour les autres, PNG pour l'écran d'accueil iOS
export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/icones/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/icones/apple-touch-icon.png" },
];

// Statistiques de visite, sans cookie : chaque page servie est signalée à l'API (voir services/mesure.server.ts)
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }, suite) => {
    const debut = performance.now();
    const reponse = await suite();
    if (reponse instanceof Response) signalerVue(request, reponse, performance.now() - debut);
    return reponse;
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFD60A" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Changement de page sans rechargement : le focus va au titre de la nouvelle page
  utiliserFocusApresNavigation();
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let titre = "Oups, une erreur";
  let details = "Quelque chose s'est mal passé. Réessaie dans un instant.";
  let pile: string | undefined;

  if (isRouteErrorResponse(error) && error.status === 404) {
    titre = "Page introuvable";
    details = "Cette page s'est fait la malle. Reviens à l'accueil pour trouver ta prochaine table.";
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    pile = error.stack;
  }

  return (
    <>
      <title>{`${titre} — SOS Miam`}</title>
      <meta name="robots" content="noindex" />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 px-4">
        <Mascotte expression="surprise" className="h-28 w-28" />
        <h1 className="text-4xl font-extrabold">{titre}</h1>
        <p className="text-gris">{details}</p>
        <a href="/" className="rounded-full border-2 border-encre bg-jaune px-6 py-3 font-semibold shadow-brut">
          Retour à l'accueil
        </a>
        {pile && <pre className="w-full overflow-x-auto rounded-xl bg-creme p-4 text-xs"><code>{pile}</code></pre>}
      </main>
    </>
  );
}
