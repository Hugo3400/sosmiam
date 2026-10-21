import {
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  LONGUEURS_SIGNALEMENT_SECURITE as LONGUEURS,
} from "../../../../packages/commun/src/regles/securite.ts";

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

export const champsSignalement = {
  nom: {
    libelle: "Ton nom ou ton pseudo",
    ...LONGUEURS.nom,
    erreur: `Dis-nous comment t'appeler (${LONGUEURS.nom.min} à ${LONGUEURS.nom.max} caractères).`,
  },
  email: {
    libelle: "Ton e-mail",
    aide: "Pour te répondre. C'est aussi lui qui relie le badge à ton compte SOS Miam.",
    max: 254,
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
    ...LONGUEURS.titre,
    erreur: `Donne un titre de ${LONGUEURS.titre.min} à ${LONGUEURS.titre.max} caractères.`,
  },
  description: {
    libelle: "Ta description",
    aide: `Les étapes pour reproduire, l'impact, et une preuve (requête, réponse, capture). ${LONGUEURS.description.min} caractères au moins.`,
    ...LONGUEURS.description,
    erreur: `Décris la faille en ${LONGUEURS.description.min} à ${LONGUEURS.description.max.toLocaleString("fr-FR")} caractères.`,
  },
  lien: {
    libelle: "Un lien",
    aide: "Une vidéo, un script, un document : une adresse qui commence par https://.",
    ...LONGUEURS.lien,
    erreur: `Donne une adresse qui commence par https:// (${LONGUEURS.lien.max} caractères au plus).`,
  },
  images: {
    libelle: "Tes captures",
    aide: `Images PNG ou JPEG, ${IMAGES_SIGNALEMENT_MAX} au plus, ${IMAGE_SIGNALEMENT_OCTETS_MAX / (1024 * 1024)} Mo chacune.`,
    retirer: "Retirer les captures",
    aRemettre: "Par sécurité, ton navigateur a oublié les captures choisies : ajoute-les de nouveau.",
  },
  tableauHonneur: {
    libelle: "Je veux mon nom au tableau d'honneur",
  },
  nomTableauHonneur: {
    libelle: "Le nom à afficher",
    aide: "Ton nom, ton pseudo ou celui de ton équipe, si tu coches la case au-dessus.",
    ...LONGUEURS.nomTableauHonneur,
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
} as const;

export const messagesSignalement = {
  unChamp: "Un champ est à corriger.",
  plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
  envoyer: "Envoyer mon signalement",
  envoi: "Envoi…",
  stockagePlein: "Nos placards débordent. On fait un peu de place sur le serveur : réessaie dans un moment, ton signalement nous intéresse.",
};
