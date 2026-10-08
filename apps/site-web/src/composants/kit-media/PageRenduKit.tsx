import type { ReactNode } from "react";

type Props = {
  largeur: number;
  hauteur: number;
  /** Marge transparente autour du dessin, en pixels */
  marge: number;
  /** Adresses de la feuille de style du site et des deux polices (latin), servies par le serveur de développement */
  feuilleStyle: string;
  policeTitre: string;
  policeTexte: string;
  children: ReactNode;
};

/**
 * Page HTML d'un visuel du kit média, à sa taille exacte, que scripts/generer-kit-media.sh capture avec Chrome sans
 * écran. Fond transparent (le Chrome est lancé avec un fond par défaut transparent), aucune barre de défilement, aucun
 * script. Polices du site en « font-display: block » : le texte attend la vraie police, jamais celle de secours.
 */
export function PageRenduKit({ largeur, hauteur, marge, feuilleStyle, policeTitre, policeTexte, children }: Props) {
  const css = `
@font-face { font-family: "Bricolage Grotesque Variable"; font-style: normal; font-weight: 200 800; font-display: block; src: url("${policeTitre}") format("woff2-variations"); }
@font-face { font-family: "Inter Variable"; font-style: normal; font-weight: 100 900; font-display: block; src: url("${policeTexte}") format("woff2-variations"); }
:root { color-scheme: normal; }
html, body { margin: 0; width: ${largeur}px; height: ${hauteur}px; overflow: hidden; background: transparent; }
`;
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="robots" content="noindex" />
        <title>Rendu du kit média</title>
        <link rel="preload" href={policeTitre} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={policeTexte} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href={feuilleStyle} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="grid place-items-center" style={{ width: largeur, height: hauteur, padding: marge, boxSizing: "border-box" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
