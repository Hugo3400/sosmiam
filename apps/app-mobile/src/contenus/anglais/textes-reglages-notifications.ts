import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_NOTIFICATIONS } from "~/contenus/textes-reglages-notifications";

export const TEXTES_REGLAGES_NOTIFICATIONS_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_NOTIFICATIONS> = {
  minuit: "midnight",
  introduction:
    "SOS alerts and events come straight to your phone; offers from places only if you turn them on. Your followers and requests are also waiting behind the bell in your feed.",
  echec: "Oops, this choice couldn't be saved on your phone. Try again a bit later.",
  offresEnAttente: "📮 Your choice for offers will go through as soon as you're back online.",
  chutEnAttente: "📮 Your “shh” will go through as soon as you're back online.",
  titre: "My notifications",
  sousTitre: "Choose what's worth making your pocket buzz.",
  chargement: "Loading your settings",
  recevoir: "Get notifications",
  recevoirDetail: "You can turn them all off in one go, no hard feelings",
  interesse: "What you care about",
  toutCoupe: "Everything's off for now. Turn notifications back on just above to choose which ones you want.",
  abonnements: "Followers and following",
  nuit: "At night",
  modeNuit: "Night mode",
  modeNuitDetail: "No notifications while you sleep",
  aPartirDe: "From",
  debutLu: "Night mode start",
  jusqua: "Until",
  finLu: "Night mode end",
  resume: (de: string, a: string) => `From ${de} to ${a}, your phone stays quiet.`,
};
