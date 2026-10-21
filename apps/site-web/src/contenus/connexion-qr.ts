// Les mots du bloc « Me connecter avec l'app » (connexion par QR code, composants/compte/ConnexionParQr.tsx) et de la
// page /q/:code. Tutoiement, sans jargon.
import type { EtatQrSite } from "~/types/connexion-qr";

export const TITRE_QR = "Me connecter avec l'app";
export const INTRO_QR = "Ton téléphone est déjà connecté à SOS Miam ? Scanne un QR code avec l'app, valide, et c'est fait : pas de mot de passe à taper.";
export const BOUTON_QR = "Afficher le QR code";
export const BOUTON_REFAIRE_QR = "Refaire un code";
export const LIEN_SANS_JS_QR = "J'ai validé sur mon téléphone";
export const PRUDENCE_QR = "Ce code n'est que pour toi : ne l'envoie à personne, et ne scanne jamais celui de quelqu'un d'autre.";

/** Le texte sous le QR, selon où il en est */
export const MESSAGES_QR: Record<EtatQrSite, string> = {
  attente: "Scanne ce code avec l'app SOS Miam (Profil → ⚙️ Paramètres → Mon compte → Connecter un appareil).",
  scanne: "Confirme sur ton téléphone…",
  accepte: "C'est validé : on t'ouvre la porte !",
  refuse: "Refusé depuis le téléphone : rien n'a été ouvert. Tu peux refaire un code.",
  expire: "Code expiré : en refaire un.",
  erreur: "Petit pépin de notre côté. Réessaie dans un instant, ou connecte-toi avec ton e-mail.",
  trop: "Beaucoup de codes demandés d'un coup : attends quelques minutes avant d'en refaire un.",
};

/** Page /q/:code (le QR scanné avec l'appareil photo, sans passer par l'app) */
export const PAGE_Q = {
  titre: "Ouvre l'app SOS Miam pour te connecter",
  chapo: "Ce QR code se scanne depuis l'app SOS Miam, déjà connectée à ton compte : Profil → ⚙️ Paramètres → Mon compte → Connecter un appareil.",
  bouton: "Ouvrir l'app",
  aide: "Pas encore l'app ? Elle arrive bientôt sur les stores. En attendant, connecte-toi avec ton e-mail sur l'écran qui t'a montré ce code.",
  introuvableTitre: "Ce QR code a pris l'eau",
  introuvableChapo: "Il est incomplet ou mal recopié. Fais-en afficher un nouveau sur l'écran de connexion, puis scanne-le avec l'app.",
};
