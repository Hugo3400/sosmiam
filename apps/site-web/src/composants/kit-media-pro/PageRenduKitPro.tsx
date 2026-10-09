import type { ReactNode } from "react";

import type { FormatImpression } from "~/contenus/kit-media-pro";

type Props = {
  /** Format du papier ; chaque page est dessinée à sa taille en pixels (300 dpi) */
  format: FormatImpression;
  /** Version PDF : chaque page est ramenée à la taille du papier, une page imprimée par page dessinée */
  impression: boolean;
  /** Adresses de la feuille de style du site et des deux polices (latin), servies par le serveur de développement */
  feuilleStyle: string;
  policeTitre: string;
  policeTexte: string;
  children: ReactNode[];
};

/**
 * Page HTML d'un visuel du kit média pro, que scripts/generer-kit-media-pro.sh capture avec Chrome sans écran : en PNG
 * (la première page, à sa taille exacte en pixels) ou en PDF (toutes les pages, au format du papier, sans marge, fonds
 * imprimés). Aucun script. Polices du site en « font-display: block » : le texte attend la vraie police.
 */
export function PageRenduKitPro({ format, impression, feuilleStyle, policeTitre, policeTexte, children }: Props) {
  // 1 mm = 96 / 25,4 px CSS : le dessin à 300 dpi est réduit d'autant pour remplir exactement la feuille
  const reduction = (format.largeurMm * 96) / 25.4 / format.largeur;
  const taillePage = impression
    ? `@page { size: ${format.largeurMm}mm ${format.hauteurMm}mm; margin: 0; }
html, body { margin: 0; }
.page-kit { width: ${format.largeurMm}mm; height: ${format.hauteurMm}mm; overflow: hidden; break-after: page; }
.page-kit:last-child { break-after: auto; }
.page-kit > div { zoom: ${reduction}; }`
    : `html, body { margin: 0; width: ${format.largeur}px; height: ${format.hauteur}px; overflow: hidden; }`;
  const css = `
@font-face { font-family: "Bricolage Grotesque Variable"; font-style: normal; font-weight: 200 800; font-display: block; src: url("${policeTitre}") format("woff2-variations"); }
@font-face { font-family: "Inter Variable"; font-style: normal; font-weight: 100 900; font-display: block; src: url("${policeTexte}") format("woff2-variations"); }
:root { color-scheme: normal; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
${taillePage}
`;
  const pages = impression ? children : children.slice(0, 1);
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="robots" content="noindex" />
        <title>Rendu du kit média pro</title>
        <link rel="preload" href={policeTitre} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={policeTexte} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href={feuilleStyle} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        {pages.map((page, i) => (
          <div key={i} className="page-kit">
            <div>{page}</div>
          </div>
        ))}
      </body>
    </html>
  );
}
