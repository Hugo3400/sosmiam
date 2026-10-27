import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_IMAGES_LIEU_ANGLAIS } from "./anglais/pro-images-lieu.ts";

export const TEXTES_IMAGES_LIEU = {
  meta: {
    titre: (nom: string) => `Bannière et logo · ${nom}`,
    titreParDefaut: "Bannière et logo",
    description: "La bannière et le logo de ton lieu sur SOS Miam.",
  },
  page: "Bannière et logo",
  chapo: "Une belle photo en haut de ta fiche, ton logo à côté de ton nom : les gourmands te reconnaissent avant même d'avoir faim.",
  lien: "Bannière et logo",
  encartFiche: {
    titre: "Ta bannière et ton logo",
    texte: "Une photo qui donne envie en haut de ta fiche, et ton logo à côté de ton nom.",
    lienGerant: "Choisir mes images",
    lienEquipe: "Voir la bannière et le logo",
  },
  etats: {
    nonVerifie: {
      titre: "Disponible quand ton lieu est vérifié",
      texte: "La bannière et le logo sont réservés aux lieux vérifiés. Dès que l'équipe SOS Miam a confirmé que ce lieu est bien à toi, ils t'attendent ici.",
    },
    equipe: {
      titre: "Réservé au gérant",
      texte: "Seul le gérant du lieu change la bannière et le logo. Voici ce que voient les gourmands.",
    },
    sansJavascript: {
      titre: "Le recadrage a besoin de JavaScript",
      texte: "Pour couper ton image pile à la bonne taille, ton navigateur doit avoir JavaScript activé. Active-le, recharge la page, et à toi les belles images.",
    },
    nonPubliee: "Tes images partent dès que tu les envoies, et s'affichent quand ta fiche est publiée.",
    illisibles: "Oups, tes images actuelles ne se sont pas affichées. Tu peux quand même en envoyer de nouvelles, ou recharger la page dans un instant.",
  },
  apercu: {
    titre: "Aperçu sur ta fiche",
    legende: "Comme sur un téléphone : les bords de ta bannière y sont un peu coupés.",
    sansLogo: "Ton logo ici",
    nouveau: "Aperçu de ton recadrage : rien n'est en ligne tant que tu n'as pas envoyé.",
    indisponible: "L'aperçu de tes images en ligne ne se charge pas encore ici. Pas d'inquiétude : elles sont bien enregistrées.",
  },
  images: {
    banniere: {
      titre: "La bannière",
      format: (largeur: number, hauteur: number) => `Une photo en largeur, recadrée en ${largeur} × ${hauteur}.`,
      conseils: [
        "Une photo de ta salle, de ta terrasse ou d'un plat qui fait saliver.",
        "Rien d'important sur les bords : selon l'écran, ils sont coupés. Et pas besoin d'écrire ton nom dessus, il est juste en dessous.",
        "Une photo à toi, ou que tu as le droit d'utiliser.",
      ],
      enLigne: "Ta bannière est en ligne.",
      aucune: "Pas encore de bannière : ta fiche affiche tes couleurs et ton emoji.",
      inconnue: "Ta bannière s'affichera ici quand ta fiche sera publiée.",
      envoyer: "Envoyer cette bannière",
      precision: " la bannière",
      confirmer: "Retirer ta bannière ? Ta fiche reprendra tes couleurs et ton emoji.",
      envoyee: "C'est en ligne : ta nouvelle bannière trône en haut de ta fiche !",
      retiree: "C'est fait : ta bannière est retirée.",
      zone: "Ta bannière, recadrée",
    },
    logo: {
      titre: "Le logo",
      format: (largeur: number, hauteur: number) => `Un logo carré, recadré en ${largeur} × ${hauteur}. La transparence est gardée.`,
      conseils: [
        "Ton logo en entier, bien centré, avec un peu d'air autour.",
        "Sur fond transparent, c'est l'idéal (un PNG) : il se pose tout seul sur le blanc de ta carte.",
        "Pas de photo de ta devanture ici : elle serait toute petite.",
      ],
      enLigne: "Ton logo est en ligne.",
      aucune: "Pas encore de logo : ta carte affiche seulement ton nom.",
      inconnue: "Ton logo s'affichera ici quand ta fiche sera publiée.",
      envoyer: "Envoyer ce logo",
      precision: " le logo",
      confirmer: "Retirer ton logo ? Ta carte n'affichera plus que ton nom.",
      envoyee: "C'est en ligne : ton logo a pris place à côté de ton nom !",
      retiree: "C'est fait : ton logo est retiré.",
      zone: "Ton logo, recadré",
    },
  },
  boutons: {
    choisir: "Choisir une image",
    changer: "Changer",
    autre: "Choisir une autre image",
    retirer: "Retirer",
    annuler: "Annuler",
    confirmer: "Oui, retirer",
    garder: "Non, je garde",
  },
  recadrage: {
    titre: "Recadre ton image",
    aide: "Fais glisser l'image pour choisir ce qui reste dans le cadre, ou règle-la avec les curseurs.",
    zoom: "Zoom",
    valeurZoom: (zoom: string) => `${zoom} fois`,
    horizontal: "De gauche à droite",
    vertical: "De haut en bas",
    floue: "Ton image est un peu petite pour ce cadre : on l'agrandit, elle sera un peu floue. Une photo plus grande sera plus nette.",
  },
  statuts: {
    ouverture: "On ouvre ton image…",
    envoi: "On prépare ton image et on l'envoie…",
    retrait: "On retire ton image…",
  },
  erreurs: {
    format: "Ce fichier n'est pas une image JPEG, PNG ou WebP. Une photo de ton téléphone ou de ton ordinateur fera l'affaire.",
    poids: (mo: number) => `Ce fichier pèse plus de ${mo} Mo : choisis une image plus légère.`,
    illisible: "Impossible d'ouvrir cette image. Enregistre-la en JPEG ou en PNG, puis réessaie.",
    encodage: "Ton navigateur n'a pas réussi à préparer l'image. Réessaie, ou choisis-en une autre.",
    reseau: { titre: "Rien n'est parti", texte: "Ta connexion a fait des siennes : vérifie-la, puis réessaie." },
    session: { titre: "Ta session s'est fermée", texte: "Reconnecte-toi, puis reviens ici pour envoyer ton image." },
    lienConnexion: "Me reconnecter",
    stockagePlein: { titre: "Nos placards débordent", texte: "On fait un peu de place sur le serveur : réessaie ton image dans un moment." },
    reserveAuGerant: { titre: "Réservé au gérant", texte: "Seul le gérant du lieu change la bannière et le logo." },
    compteLimite: "Compte limité",
  },
} as const;

export const TEXTES_IMAGES_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_IMAGES_LIEU>> = {
  fr: TEXTES_IMAGES_LIEU,
  en: TEXTES_IMAGES_LIEU_ANGLAIS,
};
