import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "~/services/identifiants-connexion";

export type ResultatConnexionGoogle = { ok: true; idToken: string } | { ok: false; raison: "annule" | "indisponible" | "echec" };

type ModuleGoogle = typeof import("@react-native-google-signin/google-signin");

/** Le module de Google Sign-In, chargé seulement au moment de s'en servir : il n'existe pas dans Expo Go ni sur le web */
function chargerGoogle(): ModuleGoogle | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-google-signin/google-signin") as ModuleGoogle;
  } catch {
    return null;
  }
}

let configure = false;

/**
 * « Se connecter avec Google » : le choix du compte Google, puis le jeton d'identité (vérifié ensuite par l'API, e-mail
 * confirmé exigé). « indisponible » : pas de Google Sign-In ici (Expo Go, web) ; sur Android, il faudra l'identifiant client
 * Android (empreinte de la clé de signature EAS).
 */
export async function lancerConnexionGoogle(): Promise<ResultatConnexionGoogle> {
  const google = chargerGoogle();
  if (!google) return { ok: false, raison: "indisponible" };
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google;
  try {
    if (!configure) {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
      configure = true;
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const reponse = await GoogleSignin.signIn();
    if (!isSuccessResponse(reponse)) return { ok: false, raison: "annule" };
    return reponse.data.idToken ? { ok: true, idToken: reponse.data.idToken } : { ok: false, raison: "echec" };
  } catch (erreur) {
    if (isErrorWithCode(erreur) && (erreur.code === statusCodes.SIGN_IN_CANCELLED || erreur.code === statusCodes.IN_PROGRESS)) return { ok: false, raison: "annule" };
    if (isErrorWithCode(erreur) && erreur.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, raison: "indisponible" };
    return { ok: false, raison: "echec" };
  }
}
