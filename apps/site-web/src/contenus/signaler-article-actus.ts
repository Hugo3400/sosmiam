import type { RaisonSignalement } from "../../../../packages/commun/src/types/signalement.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS_ANGLAIS, TEXTES_SIGNALER_ARTICLE_ACTUS_ANGLAIS } from "~/contenus/anglais/signaler-article-actus";

export type ChoixRaisonArticleActus = {
  cle: RaisonSignalement;
  emoji: string;
  titre: string;
  detail: string;
  precisions: readonly string[];
};

export const TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS = {
  "faux-lieu": {
    titre: "Lieu inventé ou trompeur",
    detail: "L'article parle d'un lieu qui n'existe pas, ou trompe sur lui",
    precisions: ["Ce lieu n'existe pas", "Les infos sur le lieu sont fausses", "Ce n'est pas le bon lieu"],
  },
  "pub-cachee": {
    titre: "Pub cachée",
    detail: "Collaboration pas indiquée, article payé, pub pour autre chose",
    precisions: ["Collaboration commerciale pas indiquée", "Article écrit contre de l'argent", "Pub pour autre chose que le lieu"],
  },
  arnaque: {
    titre: "Arnaque",
    detail: "Faux bon plan, lien ou QR code douteux",
    precisions: ["Faux bon plan", "Lien ou QR code douteux", "Demande d'argent ou de coordonnées bancaires"],
  },
  haine: {
    titre: "Haine ou harcèlement",
    detail: "Insultes, moqueries, propos haineux",
    precisions: ["Propos haineux", "Moquerie ou harcèlement", "Menaces"],
  },
  choquant: {
    titre: "Violence ou contenu sexuel",
    detail: "Texte ou photo violente, nudité, contenu dérangeant",
    precisions: ["Violence ou cruauté", "Nudité ou contenu sexuel", "Contenu choquant ou dérangeant"],
  },
  danger: {
    titre: "Danger ou produit interdit",
    detail: "Drogue, arme, défi dangereux, incitation à boire",
    precisions: ["Drogue", "Arme", "Incitation à boire (loi Évin)", "Défi ou comportement dangereux"],
  },
  "vie-privee": {
    titre: "Vie privée",
    detail: "Quelqu'un nommé ou montré sans son accord, infos personnelles",
    precisions: ["J'apparais sans mon accord", "Quelqu'un d'autre apparaît sans son accord", "Un employé est nommé sans son accord", "Des infos personnelles sont visibles"],
  },
  "vol-contenu": {
    titre: "Contenu volé",
    detail: "Texte ou photo repris sans l'accord de son auteur",
    precisions: ["C'est mon texte ou ma photo", "C'est le contenu de quelqu'un d'autre"],
  },
  autre: {
    titre: "Autre chose",
    detail: "Dis-nous avec tes mots ce qui ne va pas",
    precisions: [],
  },
} satisfies Record<RaisonSignalement, { titre: string; detail: string; precisions: readonly string[] }>;

export const TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS>> = {
  fr: TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS,
  en: TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS_ANGLAIS,
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

export const RAISONS_SIGNALER_ARTICLE_ACTUS: readonly ChoixRaisonArticleActus[] = (Object.keys(EMOJIS_RAISONS) as RaisonSignalement[]).map((cle) => ({
  cle,
  emoji: EMOJIS_RAISONS[cle],
  ...TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS[cle],
}));

export const TEXTES_SIGNALER_ARTICLE_ACTUS = {
  meta: {
    titreArticle: (titre: string) => `Signaler l'article « ${titre} »`,
    titreReponse: (nom: string) => `Signaler la réponse de ${nom}`,
    description: "Un article ou une réponse qui ne va pas ? Dis-le à l'équipe de modération de SOS Miam.",
    introuvable: "Article introuvable — SOS Miam",
  },
  retour: "Retour à l'article",
  titre: { article: "Signaler cet article", reponse: "Signaler cette réponse" },
  intro: {
    article: (titre: string) => `L'article « ${titre} » te pose souci ? Dis-nous ce qui cloche : l'équipe regarde chaque signalement, à la main.`,
    reponse: (nom: string) => `La réponse de ${nom} sous cet article te pose souci ? Dis-nous ce qui cloche : l'équipe regarde chaque signalement, à la main.`,
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
  donnees: "Pas besoin de compte : on ne te demande ni ton nom ni ton e-mail, et ni l'auteur ni le lieu ne sauront que c'est toi.",
  donneesLien: "Ce qu'on garde, et combien de temps",
  envoyer: "Envoyer le signalement",
  envoi: "Envoi…",
  annuler: "Annuler",
  erreurs: {
    unChamp: "Un point à revoir avant d'envoyer.",
    plusieursChamps: (nombre: number) => `${nombre} points à revoir avant d'envoyer.`,
    raison: "Choisis ce qui ne va pas.",
    explicationCourte: "Pour « Autre chose », dis-nous en quelques mots ce qui ne va pas (10 caractères au moins).",
    explicationLongue: "500 caractères au plus : va à l'essentiel, l'équipe saura lire.",
    refuse: "Ton signalement n'est pas passé : vérifie ce que tu as choisi et ton explication, puis renvoie-le.",
  },
  merci: {
    titre: "Merci, l'équipe va regarder",
    texte: {
      article: "Ton signalement est bien arrivé. L'équipe de modération relit l'article et décide s'il peut rester en ligne.",
      reponse: "Ton signalement est bien arrivé. L'équipe de modération relit la réponse du lieu et décide si elle peut rester en ligne.",
    },
    retour: "Retour à l'article",
  },
} as const;

export const TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SIGNALER_ARTICLE_ACTUS>> = {
  fr: TEXTES_SIGNALER_ARTICLE_ACTUS,
  en: TEXTES_SIGNALER_ARTICLE_ACTUS_ANGLAIS,
};
