import { renderToStaticMarkup } from "react-dom/server";

import type { Route } from "./+types/rendu-kit-lieux";
import { ecrireTextesKitLieux, fichiersKitMediaLieux, reglesKitMediaLieux, visuelsKitMediaLieux } from "~/contenus/kit-media-lieux";

/**
 * GET /rendu-kit-lieux/:visuel : de quoi refaire les fichiers du kit média des lieux (scripts/generer-kit-media-lieux.sh),
 * sur le serveur de développement seulement. En ligne, l'adresse n'existe pas (404) et ce code disparaît de la version construite.
 * - /rendu-kit-lieux/liste : les fichiers à produire, un par ligne : « png <id> <chemin> <largeur> <hauteur> » ou
 *   « pdf <id> <chemin> 1 <largeur en mm> <hauteur en mm> » ;
 * - /rendu-kit-lieux/<id> : le visuel à sa taille exacte en pixels, à capturer en PNG ;
 * - /rendu-kit-lieux/<id>?impression=1 : le même, à la taille du papier, à imprimer en PDF ;
 * - /rendu-kit-lieux/a-lire.txt : les textes prêts à poster et les règles, glissés dans le zip.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  if (import.meta.env.DEV) return rendreKitLieux(params.visuel, new URL(request.url).searchParams.get("impression") === "1");
  throw new Response("Introuvable", { status: 404 });
}

const enTetesTexte = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

async function rendreKitLieux(demande: string, impression: boolean): Promise<Response> {
  if (demande === "liste") return new Response(listerFichiers(), { headers: enTetesTexte });
  if (demande === "a-lire.txt") return new Response(ecrireALire(), { headers: enTetesTexte });

  const visuel = visuelsKitMediaLieux.find((v) => v.id === demande);
  if (!visuel || (impression && !visuel.pdf)) throw new Response("Visuel inconnu", { status: 404 });

  // Chargés ici seulement : la version en ligne n'embarque ni ces fichiers ni les dessins
  const [{ default: feuilleStyle }, { default: policeTitre }, { default: policeTexte }, { pagesKitLieux }, { PageRenduKitPro }] = await Promise.all([
    import("~/styles/app.css?url"),
    import("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url"),
    import("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url"),
    import("~/composants/kit-media-lieux/dessins-kit-lieux"),
    import("~/composants/kit-media-pro/PageRenduKitPro"),
  ]);
  const page = renderToStaticMarkup(
    <PageRenduKitPro
      format={visuel.format}
      impression={impression}
      feuilleStyle={feuilleStyle}
      policeTitre={policeTitre}
      policeTexte={policeTexte}
      transparent={visuel.groupe === "logos"}
    >
      {[pagesKitLieux[visuel.id]]}
    </PageRenduKitPro>,
  );
  return new Response(`<!DOCTYPE html>${page}`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

/** Les fichiers à produire (le zip est fait ensuite par le script). */
function listerFichiers(): string {
  const lignes = fichiersKitMediaLieux.flatMap((fichier) => {
    const visuel = visuelsKitMediaLieux.find((v) => v.id === fichier.visuel);
    if (!visuel) return [];
    const { format } = visuel;
    return fichier.format === "PDF"
      ? [`pdf ${visuel.id} ${fichier.chemin} 1 ${format.largeurMm} ${format.hauteurMm}`]
      : [`png ${visuel.id} ${fichier.chemin} ${format.largeur} ${format.hauteur}`];
  });
  return `${lignes.join("\n")}\n`;
}

/** a-lire.txt : les fichiers, les textes prêts à poster (avec des crochets à remplacer) et les règles. */
function ecrireALire(): string {
  const puces = (lignes: string[]) => lignes.map((ligne) => `- ${ligne}`).join("\n");
  const textes = ecrireTextesKitLieux("[le nom de ton lieu]", "[l'adresse de ta fiche sur sosmiam.fr]");
  return `${[
    "Kit média SOS Miam pour ton lieu : à lire avant de poster",
    "Ce kit est réservé aux lieux inscrits sur SOS Miam (gérant et équipe), pour dire que ton lieu est sur SOS Miam. Sur SOS Miam, tout est gratuit pour les lieux : pas d'abonnement, pas de commission.",
    "Les visuels « Miam Safe » sont réservés aux lieux qui ont signé la charte Miam Safe, dans l'espace pro (pro.sosmiam.fr).",
    `Les fichiers :\n${puces(fichiersKitMediaLieux.filter((f) => f.visuel).map((f) => `${f.nom} : ${f.titre} (${f.format}, ${f.taille?.replaceAll(" ", " ")})`))}`,
    `Tu peux :\n${puces(reglesKitMediaLieux.peux)}`,
    `Tu ne peux pas :\n${puces(reglesKitMediaLieux.peuxPas)}`,
    ...textes.map((t) => `${t.titre}${t.miamSafe ? " (lieux Miam Safe)" : ""} :\n\n${t.texte}`),
    "Une question ? Écris-nous : bonjour@sosmiam.fr",
  ].join("\n\n")}\n`;
}
