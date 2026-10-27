import {
  ANNEES_CONSERVATION_SECURITE,
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  LONGUEURS_SIGNALEMENT_SECURITE as LONGUEURS,
} from "../../../../packages/commun/src/regles/securite.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_FORMULAIRE_SECURITE_ANGLAIS } from "~/contenus/anglais/formulaire-securite";

export type ChampSignalement =
  | "nom"
  | "email"
  | "cible"
  | "titre"
  | "description"
  | "lien"
  | "images"
  | "nomTableauHonneur"
  | "majeur"
  | "reglesAcceptees";

export const ORDRE_CHAMPS_SIGNALEMENT: ChampSignalement[] = [
  "nom", "email", "cible", "titre", "description", "lien", "images", "nomTableauHonneur", "majeur", "reglesAcceptees",
];

export const LIMITE_ENVOI_SIGNALEMENT = IMAGES_SIGNALEMENT_MAX * IMAGE_SIGNALEMENT_OCTETS_MAX + 512 * 1024;

export const LONGUEUR_MAX_EMAIL_SIGNALEMENT = 254;

export const LIEN_DONNEES_SECURITE = "/confidentialite#chasse-aux-bugs";

export const TEXTES_FORMULAIRE_SECURITE = {
  champs: {
    nom: {
      libelle: "Ton nom ou ton pseudo",
      erreur: `Dis-nous comment t'appeler (${LONGUEURS.nom.min} à ${LONGUEURS.nom.max} caractères).`,
    },
    email: {
      libelle: "Ton e-mail",
      aide: "Pour te répondre. C'est aussi lui qui relie le badge à ton compte SOS Miam.",
      exemple: "ton@email.fr",
      erreur: "Cette adresse e-mail ne semble pas valide.",
    },
    cible: {
      libelle: "Où est la faille ?",
      choisir: "Choisis…",
      erreur: "Choisis où se trouve la faille.",
    },
    titre: {
      libelle: "Un titre",
      aide: "En une ligne : le type de faille et l'endroit. Par exemple : « XSS stockée dans le nom d'une liste ».",
      erreur: `Donne un titre de ${LONGUEURS.titre.min} à ${LONGUEURS.titre.max} caractères.`,
    },
    description: {
      libelle: "Ta description",
      aide: `Les étapes pour reproduire, l'impact, et une preuve (requête, réponse, capture). ${LONGUEURS.description.min} caractères au moins.`,
      erreur: `Décris la faille en ${LONGUEURS.description.min} à ${LONGUEURS.description.max.toLocaleString("fr-FR")} caractères.`,
    },
    lien: {
      libelle: "Un lien",
      aide: "Une vidéo, un script, un document : une adresse qui commence par https://.",
      erreur: `Donne une adresse qui commence par https:// (${LONGUEURS.lien.max} caractères au plus).`,
    },
    images: {
      libelle: "Tes captures",
      aide: `Images PNG ou JPEG, ${IMAGES_SIGNALEMENT_MAX} au plus, ${IMAGE_SIGNALEMENT_OCTETS_MAX / (1024 * 1024)} Mo chacune.`,
      retirer: "Retirer les captures",
      aRemettre: "Par sécurité, ton navigateur a oublié les captures choisies : ajoute-les de nouveau.",
      choisies: "Captures choisies",
    },
    tableauHonneur: {
      libelle: "Je veux mon nom au tableau d'honneur",
    },
    nomTableauHonneur: {
      libelle: "Le nom à afficher",
      aide: "Ton nom, ton pseudo ou celui de ton équipe, si tu coches la case au-dessus.",
      erreur: `Donne le nom à afficher (${LONGUEURS.nomTableauHonneur.min} à ${LONGUEURS.nomTableauHonneur.max} caractères), ou décoche la case.`,
    },
    majeur: {
      libelle: "J'ai 18 ans ou plus",
      erreur: "Il faut avoir 18 ans ou plus pour signaler une faille : coche la case si c'est ton cas.",
    },
    reglesAcceptees: {
      libelle: "J'ai lu les règles",
      relire: "Les relire",
      erreur: "Coche la case pour nous dire que tu as lu les règles.",
    },
  },
  cibles: {
    site: "sosmiam.fr (le site)",
    espaces: "ambassadeur.sosmiam.fr ou pro.sosmiam.fr (les espaces)",
    api: "api.sosmiam.fr (l'API)",
    "app-ios": "L'app pour iPhone",
    "app-android": "L'app pour Android",
  },
  messages: {
    unChamp: "Un champ est à corriger.",
    plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
    envoyer: "Envoyer mon signalement",
    envoi: "Envoi…",
    stockagePlein: "Nos placards débordent. On fait un peu de place sur le serveur : réessaie dans un moment, ton signalement nous intéresse.",
  },
  facultatif: " (facultatif)",
  compteur: (longueur: number, maximum: number) => `${longueur.toLocaleString("fr-FR")} / ${maximum.toLocaleString("fr-FR")} caractères`,
  legendeTableauHonneur: "Tableau d'honneur",
  piege: "Ne remplis pas ce champ",
  donnees: `Ton signalement est gardé chiffré, puis effacé ${ANNEES_CONSERVATION_SECURITE} ans après sa clôture. `,
  enSavoirPlus: "En savoir plus",
};

export type TextesFormulaireSecurite = Traduction<typeof TEXTES_FORMULAIRE_SECURITE>;

export const TEXTES_FORMULAIRE_SECURITE_PAR_LANGUE: ParLangue<TextesFormulaireSecurite> = {
  fr: TEXTES_FORMULAIRE_SECURITE,
  en: TEXTES_FORMULAIRE_SECURITE_ANGLAIS,
};
