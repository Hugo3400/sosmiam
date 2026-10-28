import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_INFOS } from "~/contenus/textes-reglages-infos";

export const TEXTES_REGLAGES_INFOS_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_INFOS> = {
  reglesPseudo:
    "3 to 20 characters: lowercase letters without accents, numbers, full stops or underscores (not at the start or end, and never two in a row).",
  pseudoSansCompte: "Without an account, it stays on this phone. We can only check it's free once you have an account.",
  dateAvecCompte:
    "It can't be changed from here: it's what confirms you're old enough to be on SOS Miam. A mistake? Email us at bonjour@sosmiam.fr and we'll fix it with you.",
  dateSurTelephone:
    "It can't be changed from here: it's what confirms you're old enough to be on SOS Miam. A mistake? This profile only exists on your phone, so we can't fix it on our side. The only way: “Clear my data and start again”, in Settings › Your data (everything else goes back to zero too).",
  prenomVide: "We need at least your first name to say hello!",
  garderPseudo: "Keep a username – it's how your friends find you.",
  aideSansCompteAvecPseudo: "It's how your friends find you (your invite link and QR code will follow if it changes).",
  aideSansCompteSansPseudo:
    "You don't have one yet. Pick one so your friends can find you: 3 to 20 characters, lowercase letters, numbers, full stops or underscores.",
  pseudoInterdit: "That username doesn't go down well here. Pick a nicer one.",
  pseudoPropose: (pseudo: string) => `Suggested username: ${pseudo}`,
  rateTitre: "Oops, we hit a snag",
  rateTexte: "Your details couldn't be saved. Try again in a moment.",
  titre: "My details",
  sousTitre: "Just enough to greet you by name and dig up good finds near you.",
  unInstant: "Just a sec…",
  enregistrer: "Save changes",
  enregistrerIndice: "Saves your details and goes back to the previous screen",
  prenom: "Your first name",
  prenomExemple: "Alex",
  pseudo: "Your username",
  pseudoExemple: "alex42",
  autreIdeeLu: "Another username idea",
  proposerLu: "Suggest a username for me",
  proposerIndice: "Replaces your username with a suggestion based on your first name",
  autreIdee: "🎲 Another idea",
  proposer: "🎲 Suggest a username",
  nom: "Your surname",
  facultatif: "optional",
  nomAide: "You can leave it blank – we won't take it personally.",
  nomExemple: "Smith",
  dateLue: (date: string, age: number, explication: string) => `Your date of birth: ${date}, ${age} years old. ${explication}`,
  dateTitre: "Your date of birth",
  dateValeur: (date: string, age: number) => `${date} · ${age} years old`,
  pseudoPris: (titre: string, texte: string) => `${titre}! ${texte}`,
};
