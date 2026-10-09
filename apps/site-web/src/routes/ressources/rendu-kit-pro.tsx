import { renderToStaticMarkup } from "react-dom/server";

import type { Route } from "./+types/rendu-kit-pro";
import { pagesKitPro } from "~/composants/kit-media-pro/dessins-kit-pro";
import { PageRenduKitPro } from "~/composants/kit-media-pro/PageRenduKitPro";
import {
  fichiersKitMediaPro, mailType, motComptoir, reglesKitMediaPro, texteAffiche, texteFlyerRecto, texteFlyerVerso, usageKitMediaPro,
  visuelsKitMediaPro, EMAIL_CONTACT_KIT_PRO, LIEN_INSCRIRE_LIEU,
} from "~/contenus/kit-media-pro";

/**
 * GET /rendu-kit-pro/:visuel : de quoi refaire les fichiers du kit média pro (scripts/generer-kit-media-pro.sh), sur le
 * serveur de développement seulement. En ligne, l'adresse n'existe pas (404) et tout ce code disparaît de la version construite.
 * - /rendu-kit-pro/liste : les fichiers à produire, un par ligne : « png <id> <chemin> <largeur> <hauteur> » ou
 *   « pdf <id> <chemin> <pages> <largeur en mm> <hauteur en mm> » ;
 * - /rendu-kit-pro/<id> : la première page du visuel à sa taille exacte en pixels (300 dpi), à capturer en PNG ;
 * - /rendu-kit-pro/<id>?impression=1 : toutes ses pages, au format du papier, à imprimer en PDF ;
 * - /rendu-kit-pro/a-lire.txt : l'usage, les textes (mot du comptoir, mail type, affiche, flyer) et les règles, glissés dans le zip.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  if (import.meta.env.DEV) return rendreKitPro(params.visuel, new URL(request.url).searchParams.get("impression") === "1");
  throw new Response("Introuvable", { status: 404 });
}

const enTetesTexte = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

async function rendreKitPro(demande: string, impression: boolean): Promise<Response> {
  if (demande === "liste") return new Response(listerFichiers(), { headers: enTetesTexte });
  if (demande === "a-lire.txt") return new Response(ecrireALire(), { headers: enTetesTexte });

  const visuel = visuelsKitMediaPro.find((v) => v.id === demande);
  if (!visuel || (impression ? !visuel.pdf : !visuel.png)) throw new Response("Visuel inconnu", { status: 404 });

  // Chargés ici seulement (et pas en haut du fichier) : la version en ligne n'embarque ni ces fichiers ni leurs copies
  const [{ default: feuilleStyle }, { default: policeTitre }, { default: policeTexte }] = await Promise.all([
    import("~/styles/app.css?url"),
    import("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url"),
    import("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url"),
  ]);
  const page = renderToStaticMarkup(
    <PageRenduKitPro format={visuel.page} impression={impression} feuilleStyle={feuilleStyle} policeTitre={policeTitre} policeTexte={policeTexte}>
      {pagesKitPro[visuel.id]}
    </PageRenduKitPro>,
  );
  return new Response(`<!DOCTYPE html>${page}`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

/** Les fichiers à produire (le zip est fait ensuite par le script). */
function listerFichiers(): string {
  const lignes = fichiersKitMediaPro.flatMap((fichier) => {
    const visuel = visuelsKitMediaPro.find((v) => v.id === fichier.visuel);
    if (!visuel) return [];
    const { page } = visuel;
    return fichier.format === "PDF"
      ? [`pdf ${visuel.id} ${fichier.chemin} ${visuel.pages} ${page.largeurMm} ${page.hauteurMm}`]
      : [`png ${visuel.id} ${fichier.chemin} ${page.largeur} ${page.hauteur}`];
  });
  return `${lignes.join("\n")}\n`;
}

/** a-lire.txt : comment se servir du kit, tous ses textes et ses règles, pour qui reçoit le zip. */
function ecrireALire(): string {
  const puces = (lignes: string[]) => lignes.map((ligne) => `- ${ligne}`).join("\n");
  const atouts = (liste: { titre: string; texte: string }[]) => puces(liste.map((a) => `${a.titre} : ${a.texte}`));
  return `${[
    "Kit média pro SOS Miam : à lire avant de passer voir un lieu",
    "Ce kit est réservé aux ambassadeurs certifiés SOS Miam, pour présenter SOS Miam aux lieux : un usage personnel et non commercial, qui prend fin dès que tu n'es plus ambassadeur certifié. Conditions d'utilisation : https://sosmiam.fr/cgu#ambassadeurs",
    "Pour un lieu, tout est gratuit : pas d'abonnement, pas de commission, pas d'engagement. SOS Miam vit de la publicité, toujours signalée et sans effet sur le classement.",
    `Comment t'en servir ?\n${usageKitMediaPro.map((etape, i) => `${i + 1}. ${etape}`).join("\n")}`,
    `Les fichiers :\n${puces(fichiersKitMediaPro.filter((f) => f.visuel).map((f) => `${f.nom} : ${f.titre} (${f.format}, ${f.taille?.replaceAll(" ", " ")})`))}`,
    `Règle d'or : jamais payé par un lieu. Si un lieu t'offre quelque chose (un repas, un verre…) et que tu en parles, écris clairement « Collaboration commerciale ».`,
    `Tu peux :\n${puces(reglesKitMediaPro.peux)}`,
    `Tu ne peux pas :\n${puces(reglesKitMediaPro.peuxPas)}`,
    `${motComptoir.titre} :\n\n${motComptoir.texte}\n\nQuelques conseils :\n${puces(motComptoir.conseils)}`,
    `${mailType.titre} :\n\nObjet : ${mailType.objet}\n\n${mailType.texte}\n\nQuelques conseils :\n${puces(mailType.conseils)}`,
    `Les textes de l'affiche :\n${texteAffiche.titre} ${texteAffiche.titreFin}\n${texteAffiche.sousTitre}\n${atouts(texteAffiche.atouts)}\n${texteAffiche.bandeau}\n${texteAffiche.appelQr} : ${LIEN_INSCRIRE_LIEU}\n${texteAffiche.piedDePage}`,
    `Les textes du flyer, recto :\n${texteFlyerRecto.titre} ${texteFlyerRecto.titreFin}\n${texteFlyerRecto.intro}\n${atouts(texteFlyerRecto.atouts)}`,
    `Les textes du flyer, verso :\n${texteFlyerVerso.titre} ${texteFlyerVerso.titreFin}\n${texteFlyerVerso.etapes.map((etape, i) => `${i + 1}. ${etape}`).join("\n")}\n${texteFlyerVerso.appelQr} : ${LIEN_INSCRIRE_LIEU}\n${texteFlyerVerso.gratuit}`,
    `Une question ? Écris-nous : ${EMAIL_CONTACT_KIT_PRO}`,
  ].join("\n\n")}\n`;
}
