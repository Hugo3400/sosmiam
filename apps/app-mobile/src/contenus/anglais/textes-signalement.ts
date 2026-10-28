import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_SIGNALEMENT } from "~/contenus/textes-signalement";

export const TEXTES_SIGNALEMENT_ANGLAIS: Traduction<typeof TEXTES_SIGNALEMENT> = {
  dangerLu: "Is someone in danger?",
  danger: "🚨 Is someone in danger?",
  dangerTexte:
    "Call 112 or 17 (police) right away. For the most serious illegal content, you can also report it to Pharos, the French government's official reporting platform (in French).",
  appeler17Lu: "Call 17 for the police",
  appeler17: "📞 Call 17",
  pharosLu: "Open Pharos, the French government's official reporting platform",
  pharos: "Open Pharos →",
  masquageImmediat:
    "This kind of content will be hidden from everyone as soon as it's first reported, while a moderator checks it (once the app is connected to our server).",
  plutot: "More specifically…",
  facultatif: "optional",
  toucherEncore: "Tap again to remove it",
  pourquoi: "Why?",
  obligatoire: (min: number) => `required, at least ${min} characters`,
  placeholder: "In a few words: what's wrong, and when…",
  aide: (longueur: number, max: number) => `${longueur}/${max} · The more precise you are, the faster the SOS Miam team can act.`,
  sincerite:
    "By sending this, you confirm your report is made in good faith and is accurate to the best of your knowledge. Knowingly reporting content as illegal when it isn't, to get it removed, can be punished by law.",
  manque: (min: number) => `Write at least ${min} characters so we know what to look at.`,
  envoyer: "Send report",
  indiceManque: (min: number, champ: string) => `Write at least ${min} characters in “${champ}” first`,
  indiceEnvoyer: "Sends your report to the SOS Miam team",
  merciNote: "Thanks, noted",
  merciOnRegarde: "Thanks, we're looking into it",
  masqueePourTous:
    "This post won't appear in your feed any more. This kind of content is hidden from everyone as soon as it's first reported, then checked by hand by a moderator: removed for good if there's a problem, put back up if not.",
  pasMasquee: "This post won't appear in your feed any more. We'll take a close look.",
  anonyme:
    "Your report has gone to the SOS Miam team without your name, so no one knows who sent it. If there's no signal, it waits on your phone and goes as soon as you're back online.",
  retourFil: "Back to your feed",
  pourquoiTuSignales: "Why are you reporting this?",
  pourquoiTuLeSignales: "Why are you reporting it?",
  disNousEnPlus: "Tell us more – it helps the SOS Miam team.",
  publicationSur: (nomLieu: string) => `Post about ${nomLieu}`,
  retourRaisons: "Back to reasons",
  retourMenu: "Back to the menu",
  retour: "Back",
  fermer: "Close",
  signaler: (sujet: string) => `Report ${sujet}`,
  dejaDisparu: "It's already gone from your screen.",
  equipeDira: "The SOS Miam team will tell you what they've decided.",
  profilDePres: "We'll take a close look at this profile.",
  nApparaitraPlus: "You won't see it any more, and we'll take a close look.",
  ouRetrouver: (cache: boolean) =>
    `${cache ? "The SOS Miam team will tell you what they've decided" : "You'll find their decision"} in Settings › Moderation decisions. The person involved will never know it was you.`,
  gardeSurTelephone: "For now, your report is kept on your phone. It'll go to the SOS Miam team once the app is connected to our server.",
};
