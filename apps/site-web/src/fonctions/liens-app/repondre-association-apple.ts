import { HOTE_LIENS_APP } from "../../contenus/liens-app.ts";
import { creerAssociationApple } from "./creer-association-apple.ts";

/**
 * GET /.well-known/apple-app-site-association : 200 en JSON, sans redirection, sur sosmiam.fr seulement. Ailleurs (espaces
 * ambassadeur et pro, aperçu, développement) : 404, car l'app ne déclare que sosmiam.fr ; servir le fichier sur un autre
 * hôte n'apporterait rien et ferait croire qu'il compte. Une heure de cache : Apple le relit par son propre CDN.
 */
export function repondreAssociationApple(requete: Request): Response {
  if (new URL(requete.url).hostname !== HOTE_LIENS_APP) return new Response("Introuvable\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(JSON.stringify(creerAssociationApple()), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
