import type { DomaineOffreCarriere, TypeOffreCarriere } from "../../../../packages/commun/src/types/carriere.ts";
import { site } from "~/contenus/legal/informations-legales";

export const TAILLE_MAX_CV = 5 * 1024 * 1024;

export const LIMITE_ENVOI_CANDIDATURE = TAILLE_MAX_CV + 512 * 1024;

export const lienEcrireNous = `mailto:${site.emailContact}?subject=${encodeURIComponent("Je veux rejoindre SOS Miam")}`;

export const typesOffre: { valeur: TypeOffreCarriere; libelle: string; pluriel: string }[] = [
  { valeur: "benevolat", libelle: "Bénévolat", pluriel: "de bénévolat" },
  { valeur: "freelance", libelle: "Freelance ou mission", pluriel: "de freelance ou de mission" },
];

export const domainesOffre: Record<DomaineOffreCarriere, { libelle: string; emoji: string }> = {
  moderation: { libelle: "Modération", emoji: "🛡️" },
  "reseaux-sociaux": { libelle: "Réseaux sociaux", emoji: "📣" },
  graphisme: { libelle: "Graphisme et illustration", emoji: "🎨" },
  video: { libelle: "Vidéo et montage", emoji: "🎬" },
  developpement: { libelle: "Développement", emoji: "💻" },
  autre: { libelle: "Coup de main", emoji: "✨" },
};

export const pageCarriere = {
  titre: "On recrute",
  description:
    "Rejoins SOS Miam : bénévolat (modération, réseaux sociaux) ou freelance (graphisme, vidéo, développement), à distance, partout en France, dès 18 ans.",
  badge: "Carrière",
  chapo:
    "SOS Miam aide à trouver les restos, bars et pâtisseries indépendants de ton quartier, et donne un coup de main aux lieux en SOS. Gratuit pour les Miamis comme pour les lieux, et fait avec beaucoup d'amour (et un peu de gourmandise).",
  franchise: "On est une petite équipe, pas encore une entreprise : on cherche des bénévoles et des freelances.",
  pourTous: ["À distance, partout en France", "Dès 18 ans", "Ni stage, ni alternance, ni emploi pour l'instant"],
  esprit: [
    { emoji: "🏘️", titre: "Le quartier d'abord", texte: "On met en avant les adresses indépendantes, celles qui font le sel d'une rue." },
    { emoji: "🛟", titre: "La Brigade à la rescousse", texte: "Quand un lieu lance un SOS, les Miamis débarquent à table. Un vrai coup de main, jamais de la pitié." },
    { emoji: "🧡", titre: "Bonne humeur de rigueur", texte: "On se tutoie, on rit beaucoup, et on prend soin les uns des autres." },
  ],
};

export const formulesCarriere = {
  benevolat: {
    titre: "Bénévolat",
    emoji: "🙌",
    texte:
      "La modération, pour garder l'app accueillante avec la Brigade, et les réseaux sociaux (TikTok, Instagram, Discord). À ton rythme, sans minimum d'heures.",
    recois: [
      "Un badge « Brigade » dans l'app et un rôle sur le Discord",
      "Une attestation de bénévolat",
      "Ton nom au générique de SOS Miam",
    ],
  },
  freelance: {
    titre: "Freelance ou mission",
    emoji: "🧑‍🎨",
    texte: "Graphisme et illustration, vidéo et montage, développement : une mission précise, avec un début et une fin.",
    recois: ["Une rémunération sur devis : pas de montant affiché, c'est toi qui proposes ton tarif"],
  },
};

export type ChampCandidature = "nom" | "email" | "message" | "lien" | "cv" | "majeur";

export const champsCandidature = {
  nom: {
    libelle: "Ton prénom et ton nom",
    minimum: 2,
    maximum: 80,
    erreur: "Dis-nous comment tu t'appelles (2 à 80 caractères).",
  },
  email: {
    libelle: "Ton e-mail",
    maximum: 254,
    erreur: "Cette adresse e-mail ne semble pas valide.",
  },
  message: {
    libelle: "Ton message",
    aide: "Qui tu es, ce qui te donne envie, ce que tu aimerais faire avec nous (20 caractères au moins).",
    minimum: 20,
    maximum: 3000,
    erreur: "Écris-nous un message de 20 à 3 000 caractères.",
  },
  lien: {
    libelle: "Un lien vers ton travail",
    aide: "Portfolio, Behance, GitHub, chaîne vidéo, compte Instagram…",
    maximum: 300,
    erreur: "Donne une adresse qui commence par https:// (300 caractères au plus).",
  },
  cv: {
    libelle: "Ton CV",
    aide: "En PDF seulement, 5 Mo au plus.",
    erreurFormat: "Ton CV doit être un fichier PDF.",
    erreurPoids: "Ton CV dépasse 5 Mo : allège-le (export PDF « taille réduite ») et réessaie.",
    aRemettre: "Par sécurité, ton navigateur a oublié le fichier choisi : ajoute ton CV de nouveau.",
  },
  majeur: {
    libelle: "J'ai 18 ans ou plus",
    erreur: "Il faut avoir 18 ans ou plus pour candidater : coche la case si c'est ton cas.",
  },
} as const;

export const messagesCandidature = {
  unChamp: "Un champ est à corriger.",
  plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
  champInconnu: "Un champ ne va pas : vérifie le formulaire.",
  tropDEnvois: "Doucement ! Trop d'envois d'affilée : réessaie dans un moment, ou écris-nous à bonjour@sosmiam.fr.",
  erreur: "Oups, ta candidature n'est pas partie. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  tropLourd: "Ton envoi est trop lourd : ton CV doit faire 5 Mo au plus. Ajoute-le de nouveau, allégé.",
  merci: "On lit chaque candidature, pour de vrai. Si ça colle, on t'écrit à l'adresse que tu nous as donnée.",
};
