import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

export type ResultatConnexionApple =
  | { ok: true; identityToken: string; nonce: string; prenom: string | null; nom: string | null }
  | { ok: false; raison: "annule" | "indisponible" | "echec" };

/**
 * « Se connecter avec Apple » : la feuille d'Apple, avec l'e-mail et le nom (Apple ne donne le nom qu'à la toute première
 * connexion : il faut le garder et l'envoyer). Apple reçoit l'empreinte SHA-256 d'un nonce tiré au hasard ; l'API reçoit
 * le nonce lui-même et vérifie que c'est bien le sien. « indisponible » : pas d'Apple ici (Android, web, Expo Go hors iPhone).
 */
export async function lancerConnexionApple(): Promise<ResultatConnexionApple> {
  try {
    if (!(await AppleAuthentication.isAvailableAsync())) return { ok: false, raison: "indisponible" };
  } catch {
    return { ok: false, raison: "indisponible" };
  }
  const nonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, "");
  try {
    const empreinte = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce, { encoding: Crypto.CryptoEncoding.HEX });
    const reponse = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: empreinte.toLowerCase(),
    });
    if (!reponse.identityToken) return { ok: false, raison: "echec" };
    return {
      ok: true,
      identityToken: reponse.identityToken,
      nonce,
      prenom: reponse.fullName?.givenName?.trim() || null,
      nom: reponse.fullName?.familyName?.trim() || null,
    };
  } catch (erreur) {
    // Fermée par la personne : rien à dire
    if ((erreur as { code?: string }).code === "ERR_REQUEST_CANCELED") return { ok: false, raison: "annule" };
    return { ok: false, raison: "echec" };
  }
}
