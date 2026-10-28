import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ANNONCES_PROFIL, BOUTON_COMPRIS, MESSAGES_INFOS } from "~/contenus/annonces-profil";

export const ANNONCES_PROFIL_ANGLAIS: Traduction<typeof ANNONCES_PROFIL> = {
  "pseudo-neutre": {
    emoji: "🏷️",
    titre: "A small username change",
    texte: "The SOS Miam team has replaced your username with a neutral one, @{pseudo}. You can choose another in Profile › Edit my profile › My details.",
    bouton: "Pick a new username",
    vers: "/reglages/infos",
  },
  "pseudo-du-serveur": {
    emoji: "🏷️",
    titre: "A small username change",
    texte: "Your friends know you as @{pseudo}: the change made on this phone never went through. You can make it again in Profile › Edit my profile › My details.",
    bouton: "Change username",
    vers: "/reglages/infos",
  },
  "prenom-limite": {
    emoji: "⏸️",
    titre: "",
    texte: "Your first name couldn't be changed, so we've kept the one on your account. We explain why in Settings › Moderation decisions. If it's a mistake, appeal and a human will read it again.",
    bouton: "See the decisions",
    vers: "/reglages/decisions-moderation",
  },
};

export const BOUTON_COMPRIS_ANGLAIS: Traduction<typeof BOUTON_COMPRIS> = "Got it";

export const MESSAGES_INFOS_ANGLAIS: Traduction<typeof MESSAGES_INFOS> = {
  prenomInterdit: "That first name doesn't go down well here! Use your real first name, or a nice little nickname.",
  pseudoInterdit: "That username doesn't go down well here – pick a nicer one.",
  pseudoMisDeCote: "The SOS Miam team has set that one aside, so it can't be used for now. Pick a brand-new one!",
  pseudoSansReseau: "To change your username, you need a bit of signal so we can check it's free. Try again once you're back online!",
  nomTropLong: "Your name's a tad too long (or full of emojis) – shorten it a little.",
  pseudoVerification: "Checking if it's free…",
  pseudoLibre: "It's free! It's yours as soon as you save your changes.",
  aidePseudoAvecCompte: "It's how your friends find you (your invite link and QR code will follow if it changes). We check it's free while you type.",
  aidePseudoManquantAvecCompte:
    "You don't have one yet – pick one so your friends can find you. 3 to 20 characters: lower-case letters, numbers, full stops or underscores. We check it's free while you type.",
  enAttenteDuReseau: "Noted! It'll go as soon as you're back online.",
  enAttenteDuServeur: "Noted! A small hiccup on our side – it'll go again on its own in a moment.",
};
