import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INSCRIPTION_CONNEXION_ANGLAIS } from "~/contenus/anglais/textes-inscription-connexion";

export const TEXTES_INSCRIPTION_CONNEXION = {
  titre: "Te revoilà !",
  sousTitre: "Connecte-toi pour retrouver tes rescousses, tes visites et tes cartes de fidélité.",
  unInstant: "Un instant…",
  meConnecter: "Me connecter",
  indiceQr: "Montre un QR code à scanner avec ton téléphone déjà connecté",
  ouEmail: "ou avec ton e-mail",
  tonEmail: "Ton e-mail",
  tonMotDePasse: "Ton mot de passe",
  motDePasseOublie: "Mot de passe oublié ?",
  emailTitre: "Ton e-mail et ton mot de passe",
  emailSousTitre: "Pour te reconnecter sur un autre téléphone. On t'enverra un lien pour confirmer ton adresse.",
  continuer: "Continuer",
  emailIncomplet: "Il manque un petit quelque chose : une adresse comme prenom@exemple.fr.",
  aideMotDePasse: (minimum: number) => `${minimum} caractères au moins. Une petite phrase, c'est parfait : « mon chat adore les crêpes ».`,
  motDePasseCourt: (manque: number) => `Encore ${manque} caractère${manque > 1 ? "s" : ""}, et c'est bon.`,
  motDePasseEmail: "Pas ton e-mail comme mot de passe, voyons !",
  cacherMotDePasse: "Cacher le mot de passe",
  voirMotDePasse: "Voir le mot de passe",
  envoyeTitre: "Regarde ta boîte mail 📬",
  envoyeSousTitre: (email: string) => `Si un compte existe pour ${email}, un lien t'y attend : il est valable 24 h. Pense aux indésirables, on s'y cache parfois.`,
  oublieSousTitre: "Ça arrive aux meilleurs. Donne-nous ton e-mail, on t'envoie un lien pour en choisir un nouveau.",
  envoyerLien: "Envoyer le lien",
  oublieAppleGoogle: "Compte créé avec Apple ou Google ? Ce lien te permet aussi de te choisir un mot de passe.",
  qrPreparation: "On prépare ton QR code",
  qrLu: "QR code de connexion : scanne-le avec ton téléphone déjà connecté",
  qrValable: (secondes: number) => `Valable encore ${secondes} s`,
  reessayer: "Réessayer",
  nouveauQr: "Un nouveau QR code",
  pourquoi: "Pourquoi ?",
  lienOuverture: "On ouvre la connexion de l'appareil",
  lienTitre: "Ce QR sert à connecter un appareil",
  lienSousTitre: "Scanne-le avec un téléphone où tu es déjà connecté à SOS Miam : Profil → ⚙️ Paramètres → Mon compte → « Connecter un appareil ».",
  compris: "Compris",
};

export const TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INSCRIPTION_CONNEXION>> = {
  fr: TEXTES_INSCRIPTION_CONNEXION,
  en: TEXTES_INSCRIPTION_CONNEXION_ANGLAIS,
};
