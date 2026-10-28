import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ETAT_PHOTO } from "~/contenus/textes-etat-photo";

export const TEXTES_ETAT_PHOTO_ANGLAIS: Traduction<typeof TEXTES_ETAT_PHOTO> = {
  envoiEnCours: "📤 Your photo's on its way to SOS Miam…",
  retraitEnCours: "🧽 Your photo's leaving SOS Miam…",
  compteLimite:
    "🔒 Your account is restricted for now, so your new photo can't be shown to others. You'll get your previous avatar back, and you can try again when the restriction ends.",
  fichier: "😕 This photo wouldn't upload (format or size). Try another one – it should go through.",
  envoiRate: "😕 Your photo couldn't be sent. Try again in a little while.",
  retraitRate: "😕 Your photo couldn't be removed. Try again in a little while.",
  suiteEnvoi: "your photo will go on its own",
  suiteRetrait: "your photo will be removed on its own",
  reseauEnvoi: (suite: string) => `📶 No signal for now – ${suite} as soon as it's back. Until then, it stays on your phone.`,
  reseauRetrait: (suite: string) => `📶 No signal for now – ${suite} as soon as it's back.`,
  dans: (attente: string) => ` in ${attente}`,
  plusTard: " a bit later",
  quota: (dans: string) => `⏳ You've changed your photo 20 times today – let's take a breather! Your new photo will go on its own${dans}.`,
  stockage: (suite: string, dans: string) => `🗄️ Our server's full to bursting (we're on it!) – ${suite}${dans}.`,
  pause: (suite: string) => `🛠️ Our server's catching its breath – ${suite} a bit later. Nothing's lost.`,
};
