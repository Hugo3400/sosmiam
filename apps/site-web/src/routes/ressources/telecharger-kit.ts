import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Route } from "./+types/telecharger-kit";
import { DOSSIER_KIT_MEDIA, fichiersKitMedia, type FichierKit } from "~/contenus/kit-media";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

const typesFichiers: Record<FichierKit["format"], string> = {
  PNG: "image/png",
  SVG: "image/svg+xml",
  ZIP: "application/zip",
};

/**
 * GET /kit-media/:fichier : un fichier du kit média, réservé aux ambassadeurs validés (sinon retour à /connexion, ou à
 * /espace qui explique le statut). Seuls les fichiers de contenus/kit-media.ts sont servis : le nom demandé est cherché
 * dans cette liste, jamais utilisé comme chemin (aucun « .. » possible). Avec ?apercu=1, le fichier s'affiche dans la
 * page (aperçus des cartes) au lieu d'être téléchargé.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  await exigerAmbassadeurActif(request);
  const fichier = fichiersKitMedia.find((f) => f.nom === params.fichier);
  // Le site est toujours lancé depuis apps/site-web (npm run dev, et npm run start pour pm2) : le kit est à côté
  const contenu = fichier ? await readFile(join(process.cwd(), DOSSIER_KIT_MEDIA, fichier.chemin)).catch(() => null) : null;
  if (!fichier || !contenu) {
    return new Response("Ce fichier n'est pas dans le kit média.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }
  const apercu = new URL(request.url).searchParams.get("apercu") === "1";
  return new Response(new Uint8Array(contenu), {
    headers: {
      "Content-Type": typesFichiers[fichier.format],
      "Content-Length": String(contenu.byteLength),
      "Content-Disposition": `${apercu ? "inline" : "attachment"}; filename="${fichier.nom}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // Un SVG ouvert seul ne peut rien charger ni lancer
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
