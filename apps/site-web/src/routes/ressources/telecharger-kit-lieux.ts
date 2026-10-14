import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Route } from "./+types/telecharger-kit-lieux";
import { DOSSIER_KIT_MEDIA_LIEUX, fichiersKitMediaLieux, type FichierKitLieux } from "~/contenus/kit-media-lieux";
import type { FichierMaquette } from "~/contenus/maquettes-kits";
import { listerRattachements } from "~/services/pro.server";
import { lireFichierMaquette } from "~/services/maquettes-kits.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const typesFichiers: Record<FichierKitLieux["format"] | FichierMaquette["format"], string> = {
  PNG: "image/png",
  PDF: "application/pdf",
  ZIP: "application/zip",
};

const enTetesTexte = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" };

/**
 * GET /kit-media-lieux/:fichier : un fichier du kit média des lieux (espace pro), réservé aux comptes rattachés à au moins
 * un lieu (gérant ou équipe, rattachement validé). Pas connecté : retour à /connexion ; sans lieu validé : 403. Seuls les
 * fichiers de contenus/kit-media-lieux.ts sont servis : le nom demandé est cherché dans cette liste, jamais utilisé comme
 * chemin. Avec ?apercu=1, le fichier s'affiche dans la page (aperçus de /lieu/:id/kit). Jamais gardé en cache (un
 * rattachement peut être retiré) : Cache-Control « private, no-store » partout, redirections comprises.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  let lieuValide = false;
  try {
    const { jeton } = await exigerCompte(request);
    const reponse = await listerRattachements(jeton, lireIpVisiteur(request));
    if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
    lieuValide = reponse.ok && reponse.rattachements.some((r) => r.statut === "valide");
  } catch (redirection) {
    // Ces adresses finissent par .png, .pdf ou .zip, qu'un relais comme Cloudflare garde sinon un moment
    if (redirection instanceof Response) redirection.headers.set("Cache-Control", "private, no-store");
    throw redirection;
  }
  if (!lieuValide) {
    return new Response("Le kit média des lieux est réservé aux comptes rattachés à un lieu : demande à rattacher le tien depuis ton espace pro.", {
      status: 403,
      headers: enTetesTexte,
    });
  }
  const duKit = fichiersKitMediaLieux.find((f) => f.nom === params.fichier);
  // Le site est toujours lancé depuis apps/site-web (npm run dev, et npm run start pour pm2) : le kit est à côté ; sinon, une
  // maquette validée de ce kit, lue dans presse/ (contenus/maquettes-kits.ts)
  const lu = duKit
    ? { fichier: duKit, contenu: await readFile(join(process.cwd(), DOSSIER_KIT_MEDIA_LIEUX, duKit.chemin)).catch(() => null) }
    : await lireFichierMaquette("lieux", params.fichier ?? "");
  const fichier = lu?.fichier;
  const contenu = lu?.contenu ?? null;
  if (!fichier || !contenu) return new Response("Ce fichier n'est pas dans le kit média des lieux.", { status: 404, headers: enTetesTexte });
  const apercu = new URL(request.url).searchParams.get("apercu") === "1";
  return new Response(new Uint8Array(contenu), {
    headers: {
      "Content-Type": typesFichiers[fichier.format],
      "Content-Length": String(contenu.byteLength),
      "Content-Disposition": `${apercu ? "inline" : "attachment"}; filename="${fichier.nom}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Une image ou un zip ouvert seul ne peut rien charger ni lancer (pas sur un PDF : Chrome n'ouvre pas un PDF « sandbox »)
      ...(fichier.format === "PDF" ? {} : { "Content-Security-Policy": "default-src 'none'; sandbox" }),
    },
  });
}
