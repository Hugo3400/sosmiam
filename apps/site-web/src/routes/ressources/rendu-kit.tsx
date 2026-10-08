import { renderToStaticMarkup } from "react-dom/server";

import type { Route } from "./+types/rendu-kit";
import { dessinsKit } from "~/composants/kit-media/dessins-kit";
import { PageRenduKit } from "~/composants/kit-media/PageRenduKit";
import {
  couleursKitMedia, etapesKitMedia, fichiersKitMedia, policesKitMedia, reglesKitMedia, visuelsKitMedia, type VisuelKit,
} from "~/contenus/kit-media";

/**
 * GET /rendu-kit/:visuel : de quoi refaire les fichiers du kit média (scripts/generer-kit-media.sh), sur le serveur de
 * développement seulement. En ligne, l'adresse n'existe pas (404) et tout ce code disparaît de la version construite.
 * - /rendu-kit/liste : les fichiers à produire, un par ligne : « png <id> <chemin> <largeur> <hauteur> » ou « svg <id> <chemin> » ;
 * - /rendu-kit/<id> : la page du visuel à sa taille exacte, à capturer (fond transparent pour les logos, la mascotte et les badges) ;
 * - /rendu-kit/<id>.svg : le dessin en fichier SVG autonome ;
 * - /rendu-kit/a-lire.txt : les règles du kit, glissées dans le zip.
 */
export async function loader({ params }: Route.LoaderArgs) {
  if (import.meta.env.DEV) return rendreKit(params.visuel);
  throw new Response("Introuvable", { status: 404 });
}

const enTetesTexte = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

async function rendreKit(demande: string): Promise<Response> {
  if (demande === "liste") return new Response(listerFichiers(), { headers: enTetesTexte });
  if (demande === "a-lire.txt") return new Response(ecrireALire(), { headers: enTetesTexte });

  const svg = demande.endsWith(".svg");
  const visuel = visuelsKitMedia.find((v) => v.id === (svg ? demande.slice(0, -".svg".length) : demande));
  if (!visuel || (svg && !visuel.svg)) throw new Response("Visuel inconnu", { status: 404 });
  if (svg) {
    return new Response(creerSvgAutonome(visuel), { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" } });
  }

  // Chargés ici seulement (et pas en haut du fichier) : la version en ligne n'embarque ni ces fichiers ni leurs copies
  const [{ default: feuilleStyle }, { default: policeTitre }, { default: policeTexte }] = await Promise.all([
    import("~/styles/app.css?url"),
    import("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url"),
    import("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url"),
  ]);
  const { dessin, marge = 0 } = dessinsKit[visuel.id];
  const page = renderToStaticMarkup(
    <PageRenduKit largeur={visuel.largeur} hauteur={visuel.hauteur} marge={marge} feuilleStyle={feuilleStyle} policeTitre={policeTitre} policeTexte={policeTexte}>
      {dessin}
    </PageRenduKit>,
  );
  return new Response(`<!DOCTYPE html>${page}`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

/** Les fichiers à produire (le zip est fait ensuite par le script). */
function listerFichiers(): string {
  const lignes = fichiersKitMedia.flatMap((fichier) => {
    const visuel = visuelsKitMedia.find((v) => v.id === fichier.visuel);
    if (!visuel) return [];
    return fichier.format === "SVG"
      ? [`svg ${visuel.id} ${fichier.chemin}`]
      : [`png ${visuel.id} ${fichier.chemin} ${visuel.largeur} ${visuel.hauteur}`];
  });
  return `${lignes.join("\n")}\n`;
}

/** Le dessin en fichier SVG autonome : la balise <svg> est refaite (espace de noms, taille, nom), sans les classes du site. */
function creerSvgAutonome(visuel: VisuelKit): string {
  const balisage = renderToStaticMarkup(dessinsKit[visuel.id].dessin);
  const viewBox = /viewBox="([^"]+)"/.exec(balisage)?.[1] ?? "0 0 200 200";
  const [, , largeur, hauteur] = viewBox.split(" ");
  const nom = visuel.dossier === "mascotte" ? "Mascotte SOS Miam" : "SOS Miam";
  const interieur = balisage.slice(balisage.indexOf(">") + 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largeur}" height="${hauteur}" role="img" aria-label="${nom}">${interieur}\n`;
}

/** a-lire.txt : les règles du kit, les couleurs et les polices, pour qui reçoit le zip. */
function ecrireALire(): string {
  const puces = (lignes: string[]) => lignes.map((ligne) => `- ${ligne}`).join("\n");
  return `${[
    "Kit média SOS Miam : à lire avant de poster",
    "Ce kit est réservé aux ambassadeurs SOS Miam, pour parler de SOS Miam : un usage personnel et non commercial, qui prend fin si ton compte est supprimé, suspendu ou refusé (conditions d'utilisation : https://sosmiam.fr/cgu#ambassadeurs).",
    `Comment ça marche ?\n${etapesKitMedia.map((etape, i) => `${i + 1}. ${etape}`).join("\n")}`,
    `Tu peux :\n${puces(reglesKitMedia.peux)}`,
    `Tu ne peux pas :\n${puces(reglesKitMedia.peuxPas)}`,
    `Les couleurs :\n${puces(couleursKitMedia.map((couleur) => `${couleur.nom} : ${couleur.hex}`))}`,
    `Les polices (gratuites) :\n${puces(policesKitMedia.map((police) => `${police.nom} : ${police.usage.toLowerCase()} ${police.lien}`))}`,
    "Une question ? Écris-nous : bonjour@sosmiam.fr",
  ].join("\n\n")}\n`;
}
