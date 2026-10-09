import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Route } from "./+types/telecharger-kit-pro";
import { DOSSIER_KIT_MEDIA_PRO, fichiersKitMediaPro, type FichierKitPro } from "~/contenus/kit-media-pro";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

const typesFichiers: Record<FichierKitPro["format"], string> = {
  PNG: "image/png",
  PDF: "application/pdf",
  ZIP: "application/zip",
};

const enTetesTexte = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" };

/**
 * GET /kit-media-pro/:fichier : un fichier du kit média pro, réservé aux ambassadeurs certifiés. Pas connecté : retour à
 * /connexion ; ambassadeur pas validé : retour à /espace ; validé sans le titre : 403. Seuls les fichiers de
 * contenus/kit-media-pro.ts sont servis : le nom demandé est cherché dans cette liste, jamais utilisé comme chemin (aucun
 * « .. » possible). Avec ?apercu=1, le fichier s'affiche dans la page (aperçus de /espace/kit-media-pro) au lieu d'être
 * téléchargé. Jamais gardé en cache (un titre peut être retiré) : Cache-Control « private, no-store » partout.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  let certifie = false;
  try {
    const { compte } = await exigerAmbassadeurActif(request);
    certifie = Boolean(compte.ambassadeur?.certifie);
  } catch (redirection) {
    // Ces adresses finissent par .png, .pdf ou .zip, qu'un relais comme Cloudflare garde sinon un moment : la redirection
    // d'une personne pas connectée resterait alors servie aux certifiés
    if (redirection instanceof Response) redirection.headers.set("Cache-Control", "private, no-store");
    throw redirection;
  }
  if (!certifie) {
    return new Response("Le kit média pro est réservé aux ambassadeurs certifiés : candidate depuis ton espace (/espace/certification).", {
      status: 403,
      headers: enTetesTexte,
    });
  }
  const fichier = fichiersKitMediaPro.find((f) => f.nom === params.fichier);
  // Le site est toujours lancé depuis apps/site-web (npm run dev, et npm run start pour pm2) : le kit est à côté
  const contenu = fichier ? await readFile(join(process.cwd(), DOSSIER_KIT_MEDIA_PRO, fichier.chemin)).catch(() => null) : null;
  if (!fichier || !contenu) return new Response("Ce fichier n'est pas dans le kit média pro.", { status: 404, headers: enTetesTexte });
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
