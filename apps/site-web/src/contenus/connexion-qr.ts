// Les mots du bloc « Me connecter avec l'app » (connexion par QR code, composants/compte/ConnexionParQr.tsx) et de la
// page /q/:code. Tutoiement, sans jargon.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { PAGE_Q_ANGLAIS, TEXTES_CONNEXION_QR_ANGLAIS } from "~/contenus/anglais/connexion-qr";
import type { EtatQrSite } from "~/types/connexion-qr";

export const TEXTES_CONNEXION_QR = {
  titre: "Me connecter avec l'app",
  intro: "Ton téléphone est déjà connecté à SOS Miam ? Scanne un QR code avec l'app, valide, et c'est fait : pas de mot de passe à taper.",
  bouton: "Afficher le QR code",
  boutonRefaire: "Refaire un code",
  unInstant: "Un instant…",
  lienSansJs: "J'ai validé sur mon téléphone",
  prudence: "Ce code n'est que pour toi : ne l'envoie à personne, et ne scanne jamais celui de quelqu'un d'autre.",
  messages: {
    attente: "Scanne ce code avec l'app SOS Miam (Profil → ⚙️ Paramètres → Mon compte → Connecter un appareil).",
    scanne: "Confirme sur ton téléphone…",
    accepte: "C'est validé : on t'ouvre la porte !",
    refuse: "Refusé depuis le téléphone : rien n'a été ouvert. Tu peux refaire un code.",
    expire: "Code expiré : en refaire un.",
    erreur: "Petit pépin de notre côté. Réessaie dans un instant, ou connecte-toi avec ton e-mail.",
    trop: "Beaucoup de codes demandés d'un coup : attends quelques minutes avant d'en refaire un.",
  } satisfies Record<EtatQrSite, string>,
};

export const TEXTES_CONNEXION_QR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONNEXION_QR>> = {
  fr: TEXTES_CONNEXION_QR,
  en: TEXTES_CONNEXION_QR_ANGLAIS,
};

/** Page /q/:code (le QR scanné avec l'appareil photo, sans passer par l'app) */
export const PAGE_Q = {
  titre: "Ouvre l'app SOS Miam pour te connecter",
  chapo: "Ce QR code se scanne depuis l'app SOS Miam, déjà connectée à ton compte : Profil → ⚙️ Paramètres → Mon compte → Connecter un appareil.",
  bouton: "Ouvrir l'app",
  aide: "Pas encore l'app ? Elle arrive bientôt sur les stores. En attendant, connecte-toi avec ton e-mail sur l'écran qui t'a montré ce code.",
  introuvableTitre: "Ce QR code a pris l'eau",
  introuvableChapo: "Il est incomplet ou mal recopié. Fais-en afficher un nouveau sur l'écran de connexion, puis scanne-le avec l'app.",
  titreMeta: "Connexion avec l'app — SOS Miam",
  decouvrir: "Découvrir SOS Miam",
};

export const PAGE_Q_PAR_LANGUE: ParLangue<Traduction<typeof PAGE_Q>> = {
  fr: PAGE_Q,
  en: PAGE_Q_ANGLAIS,
};
