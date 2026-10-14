import { HOTE_LIENS_APP, PAQUET_ANDROID } from "../../contenus/liens-app.ts";

/**
 * GET /.well-known/assetlinks.json : les liens vérifiés de l'app Android (fr.sosmiam.app). 404 tant qu'aucune empreinte
 * n'est réglée (SOS_MIAM_ANDROID_SHA256, après le premier build EAS), et sur tout autre hôte que sosmiam.fr.
 */
export function repondreLiensAndroid(requete: Request, empreintes: string[]): Response {
  if (new URL(requete.url).hostname !== HOTE_LIENS_APP || empreintes.length === 0) {
    return new Response("Introuvable\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const contenu = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: PAQUET_ANDROID, sha256_cert_fingerprints: empreintes },
    },
  ];
  return new Response(JSON.stringify(contenu), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
