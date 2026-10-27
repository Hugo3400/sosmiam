import type { RaisonSignalement } from "../../../../packages/commun/src/types/signalement.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_RAISONS_SIGNALER_IMAGE_ANGLAIS, TEXTES_SIGNALER_IMAGE_ANGLAIS } from "~/contenus/anglais/signaler-image";

export type ChoixRaisonImage = {
  cle: RaisonSignalement;
  emoji: string;
  titre: string;
  detail: string;
  precisions: readonly string[];
};

export const TEXTES_RAISONS_SIGNALER_IMAGE = {
  "faux-lieu": {
    titre: "Ce n'est pas ce lieu",
    detail: "L'image montre un autre endroit, ou trompe sur le lieu",
    precisions: ["L'image ne montre pas ce lieu", "Ce n'est pas son logo", "L'image trompe sur le lieu"],
  },
  "pub-cachee": {
    titre: "Pub cachée ou spam",
    detail: "Pub pour autre chose que le lieu, texte racoleur",
    precisions: ["Pub pour autre chose que le lieu", "Partenariat pas indiqué", "Texte ou lien publicitaire"],
  },
  arnaque: {
    titre: "Arnaque",
    detail: "Faux jeu concours, QR code ou lien douteux",
    precisions: ["Faux jeu concours", "QR code ou lien douteux", "Demande d'argent ou de coordonnées bancaires"],
  },
  haine: {
    titre: "Haine ou harcèlement",
    detail: "Insultes, moqueries, symboles ou propos haineux",
    precisions: ["Propos ou symboles haineux", "Moquerie ou harcèlement", "Menaces"],
  },
  choquant: {
    titre: "Violence ou contenu sexuel",
    detail: "Image violente, nudité, image dérangeante",
    precisions: ["Violence ou cruauté", "Nudité ou contenu sexuel", "Image choquante ou dérangeante"],
  },
  danger: {
    titre: "Danger ou produit interdit",
    detail: "Drogue, arme, défi dangereux, pub pour l'alcool",
    precisions: ["Drogue", "Arme", "Pub pour l'alcool (loi Évin)", "Défi ou comportement dangereux"],
  },
  "vie-privee": {
    titre: "Vie privée",
    detail: "Quelqu'un montré sans son accord, infos personnelles",
    precisions: ["J'apparais sans mon accord", "Quelqu'un d'autre apparaît sans son accord", "Des infos personnelles sont visibles"],
  },
  "vol-contenu": {
    titre: "Image volée",
    detail: "Photo ou logo repris sans l'accord de son auteur",
    precisions: ["C'est mon image", "C'est l'image de quelqu'un d'autre"],
  },
  autre: {
    titre: "Autre chose",
    detail: "Dis-nous avec tes mots ce qui ne va pas",
    precisions: [],
  },
} satisfies Record<RaisonSignalement, { titre: string; detail: string; precisions: readonly string[] }>;

export const TEXTES_RAISONS_SIGNALER_IMAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RAISONS_SIGNALER_IMAGE>> = {
  fr: TEXTES_RAISONS_SIGNALER_IMAGE,
  en: TEXTES_RAISONS_SIGNALER_IMAGE_ANGLAIS,
};

const EMOJIS_RAISONS: Record<RaisonSignalement, string> = {
  "faux-lieu": "🏚️",
  "pub-cachee": "📣",
  arnaque: "💸",
  haine: "🤬",
  choquant: "🔞",
  danger: "⚠️",
  "vie-privee": "🔒",
  "vol-contenu": "©️",
  autre: "💬",
};

export const RAISONS_SIGNALER_IMAGE: readonly ChoixRaisonImage[] = (Object.keys(EMOJIS_RAISONS) as RaisonSignalement[]).map((cle) => ({
  cle,
  emoji: EMOJIS_RAISONS[cle],
  ...TEXTES_RAISONS_SIGNALER_IMAGE[cle],
}));

export const TEXTES_SIGNALER_IMAGE = {
  meta: {
    titre: (nom: string) => `Signaler une image de ${nom}`,
    description: "Une bannière ou un logo qui ne va pas ? Dis-le à l'équipe de modération de SOS Miam.",
    introuvable: "Image introuvable — SOS Miam",
  },
  retour: (nom: string) => `Retour à la fiche de ${nom}`,
  titre: "Signaler une image",
  intro: (nom: string) => `La bannière ou le logo de ${nom} te pose souci ? Dis-nous ce qui cloche : l'équipe regarde chaque signalement, à la main.`,
  quelle: {
    legende: "Quelle image tu signales ?",
    banniere: "La bannière",
    logo: "Le logo",
    seule: { banniere: "Tu signales la bannière", logo: "Tu signales le logo" },
    detail: { banniere: "La grande photo en haut de la fiche", logo: "Le carré à côté du nom" },
  },
  raison: {
    legende: "Qu'est-ce qui ne va pas ?",
    precision: "Tu peux préciser (facultatif)",
  },
  explication: {
    libelle: "Explique-nous",
    facultatif: " (facultatif, sauf pour « Autre chose »)",
    aide: "Quelques mots aident l'équipe à décider vite. Pour « Autre chose », 10 caractères au moins.",
    compteur: (longueur: number, max: number) => `${longueur} / ${max} caractères`,
  },
  piege: "Ne remplis pas ce champ",
  donnees: "Pas besoin de compte : on ne te demande ni ton nom ni ton e-mail, et le lieu ne saura pas que c'est toi.",
  donneesLien: "Ce qu'on garde, et combien de temps",
  envoyer: "Envoyer le signalement",
  envoi: "Envoi…",
  annuler: "Annuler",
  erreurs: {
    unChamp: "Un point à revoir avant d'envoyer.",
    plusieursChamps: (nombre: number) => `${nombre} points à revoir avant d'envoyer.`,
    quelle: "Choisis l'image que tu signales.",
    raison: "Choisis ce qui ne va pas.",
    explicationCourte: "Pour « Autre chose », dis-nous en quelques mots ce qui ne va pas (10 caractères au moins).",
    explicationLongue: "500 caractères au plus : va à l'essentiel, l'équipe saura lire.",
    refuse: "Ton signalement n'est pas passé : vérifie ce que tu as choisi et ton explication, puis renvoie-le.",
  },
  merci: {
    titre: "Merci, l'équipe va regarder",
    texte: "Ton signalement est bien arrivé. L'équipe de modération regarde l'image et décide si elle peut rester sur la fiche.",
    retour: "Retour à la fiche",
    retourDe: (nom: string) => ` de ${nom}`,
  },
} as const;

export const TEXTES_SIGNALER_IMAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SIGNALER_IMAGE>> = {
  fr: TEXTES_SIGNALER_IMAGE,
  en: TEXTES_SIGNALER_IMAGE_ANGLAIS,
};
