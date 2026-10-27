import {
  ANNEES_CONSERVATION_SECURITE,
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  LONGUEURS_SIGNALEMENT_SECURITE as LONGUEURS,
} from "../../../../../packages/commun/src/regles/securite.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_FORMULAIRE_SECURITE } from "~/contenus/formulaire-securite";

export const TEXTES_FORMULAIRE_SECURITE_ANGLAIS: Traduction<typeof TEXTES_FORMULAIRE_SECURITE> = {
  champs: {
    nom: {
      libelle: "Your name or username",
      erreur: `Tell us what to call you (${LONGUEURS.nom.min}–${LONGUEURS.nom.max} characters).`,
    },
    email: {
      libelle: "Your email",
      aide: "So we can reply. It's also what links the badge to your SOS Miam account.",
      exemple: "your@email.com",
      erreur: "That email address doesn't look right.",
    },
    cible: {
      libelle: "Where's the flaw?",
      choisir: "Choose…",
      erreur: "Choose where the flaw is.",
    },
    titre: {
      libelle: "A title",
      aide: "In one line: the type of flaw and where it is. For example: “Stored XSS in a list name”.",
      erreur: `Give a title of ${LONGUEURS.titre.min}–${LONGUEURS.titre.max} characters.`,
    },
    description: {
      libelle: "Your description",
      aide: `Steps to reproduce, the impact, and proof (request, response, screenshot). At least ${LONGUEURS.description.min} characters.`,
      erreur: `Describe the flaw in ${LONGUEURS.description.min}–${LONGUEURS.description.max.toLocaleString("en-GB")} characters.`,
    },
    lien: {
      libelle: "A link",
      aide: "A video, a script, a document: an address starting with https://.",
      erreur: `Give an address starting with https:// (${LONGUEURS.lien.max} characters max).`,
    },
    images: {
      libelle: "Your screenshots",
      aide: `PNG or JPEG images, ${IMAGES_SIGNALEMENT_MAX} max, ${IMAGE_SIGNALEMENT_OCTETS_MAX / (1024 * 1024)} MB each.`,
      retirer: "Remove screenshots",
      aRemettre: "For security, your browser has forgotten the screenshots you chose. Add them again.",
      choisies: "Chosen screenshots",
    },
    tableauHonneur: {
      libelle: "I want my name in the hall of fame",
    },
    nomTableauHonneur: {
      libelle: "Name to show",
      aide: "Your name, your username or your team's, if you tick the box above.",
      erreur: `Give the name to show (${LONGUEURS.nomTableauHonneur.min}–${LONGUEURS.nomTableauHonneur.max} characters), or untick the box.`,
    },
    majeur: {
      libelle: "I'm 18 or over",
      erreur: "You need to be 18 or over to report a flaw. Tick the box if you are.",
    },
    reglesAcceptees: {
      libelle: "I've read the rules",
      relire: "Read them again",
      erreur: "Tick the box to let us know you've read the rules.",
    },
  },
  cibles: {
    site: "sosmiam.fr (the website)",
    espaces: "ambassadeur.sosmiam.fr or pro.sosmiam.fr (the ambassador and pro areas)",
    api: "api.sosmiam.fr (the API)",
    "app-ios": "The iPhone app",
    "app-android": "The Android app",
  },
  messages: {
    unChamp: "One field needs fixing.",
    plusieursChamps: (nombre: number) => `${nombre} fields need fixing.`,
    envoyer: "Send my report",
    envoi: "Sending…",
    stockagePlein: "Our cupboards are overflowing. We're making a bit of room on the server – try again in a moment, we really want your report.",
  },
  facultatif: " (optional)",
  compteur: (longueur: number, maximum: number) => `${longueur.toLocaleString("en-GB")} / ${maximum.toLocaleString("en-GB")} characters`,
  legendeTableauHonneur: "Hall of fame",
  piege: "Leave this field empty",
  donnees: `Your report is stored encrypted, then deleted ${ANNEES_CONSERVATION_SECURITE} years after it's closed. `,
  enSavoirPlus: "Find out more",
};
