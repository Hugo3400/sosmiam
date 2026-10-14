import { decrireNavigateur } from "../mesure/decrire-navigateur.ts";

/** Longueur maximale de la description (colonne « appareil » de demandes_connexion_qr) */
export const LONGUEUR_APPAREIL_QR = 60;

const SYSTEMES: Record<string, string> = { macOS: "Mac", Windows: "Windows", Linux: "Linux", ChromeOS: "Chromebook", Android: "Android" };

/**
 * L'appareil qui demande une connexion par QR, dit simplement d'après sa signature (User-Agent), pour l'écran de
 * confirmation de l'app : « Chrome sur Mac », « Safari sur iPhone », « l'app SOS Miam sur Android ». Jamais plus de 60
 * caractères, jamais la signature elle-même.
 */
export function decrireAppareilQr(signature: string, origine: string): string {
  const ua = signature.slice(0, 512).toLowerCase();
  const ipad = ua.includes("ipad");
  if (origine === "app") {
    // L'app (React Native) : CFNetwork et Darwin sur iPhone, okhttp sur Android
    if (/iphone|ipad|ipod|cfnetwork|darwin|ios/.test(ua)) return ipad ? "l'app SOS Miam sur iPad" : "l'app SOS Miam sur iPhone";
    if (/android|okhttp|dalvik/.test(ua)) return "l'app SOS Miam sur Android";
    return "l'app SOS Miam";
  }
  const { navigateur, systeme } = decrireNavigateur(ua);
  const nomNavigateur = navigateur === "Autre" ? "un navigateur" : navigateur;
  const nomSysteme = systeme === "iOS" ? (ipad ? "iPad" : "iPhone") : SYSTEMES[systeme] ?? null;
  return (nomSysteme ? `${nomNavigateur} sur ${nomSysteme}` : nomNavigateur).slice(0, LONGUEUR_APPAREIL_QR);
}
