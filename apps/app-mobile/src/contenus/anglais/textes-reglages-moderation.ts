import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_MODERATION } from "~/contenus/textes-reglages-moderation";

export const TEXTES_REGLAGES_MODERATION_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_MODERATION> = {
  titre: "Moderation decisions",
  sousTitre: "What the SOS Miam team decided about your content and your reports, and why.",
  visiteTitre: "This is where moderation gets back to you",
  visiteTexte:
    "This is where the SOS Miam team's decisions about your content and your reports arrive: the rule in question, its explanation, and a way to appeal for 6 months. For that, you need an account.",
  creerCompte: "Create my account",
  creerCompteIndice: "Opens account creation",
  chargementLu: "Loading the decisions",
  onRetente: "Trying again…",
  onRassemble: "Gathering the decisions…",
  rateesTitre: "The decisions didn't load",
  rateesTexte: "The network's playing up – nothing serious. Check your connection and try again?",
  reessayer: "Try again",
  reessayerIndice: "Reloads the moderation decisions",
  calmeTitre: "All quiet here",
  calmeTexte:
    "No moderation decisions about your content or your reports. If the SOS Miam team ever makes one, you'll find it here, with the rule in question and its explanation.",
  rafraichissementRate: "📡 Couldn't refresh – you're seeing the earlier decisions.",
  limitationNonVerifiee: "📡 Couldn't check whether your account is restricted. Try again?",
  onRetenteLu: "Trying again",
  discretion:
    "We never tell you who reported, and the person concerned will never know it was you who reported. An appeal is read by someone else on the SOS Miam team, not the person who decided.",
};
