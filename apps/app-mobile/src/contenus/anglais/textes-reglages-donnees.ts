import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_DONNEES } from "~/contenus/textes-reglages-donnees";

export const TEXTES_REGLAGES_DONNEES_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_DONNEES> = {
  exportPret: "📦 Your data's ready. Keep this file to yourself!",
  exportIndisponible: "📱 There's no way to save a file here. Download your data from the app, on your phone.",
  exportBientot: "🍳 Coming soon – downloading your data is still simmering in the kitchen.",
  exportTropDeDemandes: "🐢 Two downloads a day at most – try again a bit later.",
  exportHorsLigne: "📶 No signal, so nothing was sent. Try again in a moment.",
  exportErreur: (emoji: string, titre: string, texte: string) => `${emoji} ${titre}: ${texte}`,
  telecharger: "Download my social data",
  telechargerEnCours: "Gathering it all…",
  telechargerDetail: "Your friends, your lists, your get-togethers and your messages, just for you. Twice a day at most.",
  ouSontElles:
    "Your account and profile are kept on our server (your surname and date of birth are encrypted there), and so is your profile photo when you show it. Your special diet stays on this phone. Clearing here only affects this phone. To delete your account, go to “My account”.",
  ouSontEllesSansCompte:
    "Everything stays on this phone: your profile in its encrypted safe, your activity, your avatar and your preferences in the app. Nothing's sent to our server for now. And when your account arrives, your photo and your special diet won't go anywhere without your say-so.",
  effacer: "Clear my data and start again",
  effacerDetail: "Profile, avatar, rescues, saved places… it all goes back to zero",
};
