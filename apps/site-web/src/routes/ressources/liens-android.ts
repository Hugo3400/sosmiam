import type { Route } from "./+types/liens-android";

import { chargerFichierEnv } from "~/fonctions/env/charger-fichier-env";
import { lireEmpreintesAndroid } from "~/fonctions/liens-app/lire-empreintes-android";
import { repondreLiensAndroid } from "~/fonctions/liens-app/repondre-liens-android";

/**
 * GET /.well-known/assetlinks.json : liens vérifiés de l'app Android. L'empreinte SHA-256 du certificat vient de
 * SOS_MIAM_ANDROID_SHA256 (apps/site-web/.env, après le premier build EAS) ; tant qu'elle est vide : 404.
 */
export function loader({ request }: Route.LoaderArgs) {
  chargerFichierEnv();
  return repondreLiensAndroid(request, lireEmpreintesAndroid(process.env.SOS_MIAM_ANDROID_SHA256));
}
