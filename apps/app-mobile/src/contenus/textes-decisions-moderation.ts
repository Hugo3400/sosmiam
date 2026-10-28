import type { CibleDecisionModeration } from "@sos-miam/commun/types/signalement";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_DECISIONS_MODERATION_ANGLAIS } from "~/contenus/anglais/textes-decisions-moderation";

export type TexteCibleDecision = { nom: string; feminin: boolean; dansUnePhrase?: string };

export type TexteRemisParDefaut = { auteur: string; signale: string };

const CIBLES: Readonly<Record<CibleDecisionModeration, TexteCibleDecision>> = {
  commentaire: { nom: "commentaire", feminin: false },
  message: { nom: "message", feminin: false },
  liste: { nom: "liste", feminin: true },
  profil: { nom: "profil", feminin: false },
  sortie: { nom: "sortie", feminin: true },
  groupe: { nom: "groupe", feminin: false },
  avis: { nom: "avis", feminin: false, dansUnePhrase: "ton avis sur un lieu" },
  "reponse-avis": { nom: "réponse à un avis", feminin: true },
  idee: { nom: "idée", feminin: true, dansUnePhrase: "ton idée dans la boîte à idées" },
  "comment-idee": { nom: "commentaire", feminin: false, dansUnePhrase: "ton commentaire sur une idée" },
  miamis: { nom: "sortie des Miamis", feminin: true },
  "image-lieu": { nom: "image", feminin: true, dansUnePhrase: "la bannière ou le logo de ton lieu" },
  "article-actu": { nom: "article", feminin: false, dansUnePhrase: "ton article dans les Actus" },
  "reponse-actu": { nom: "réponse à un article", feminin: true, dansUnePhrase: "la réponse de ton lieu sous un article des Actus" },
  "comment-actu": { nom: "commentaire", feminin: false, dansUnePhrase: "ton commentaire sous un article des Actus" },
};

const REMIS_PAR_DEFAUT: Readonly<Partial<Record<CibleDecisionModeration, TexteRemisParDefaut>>> = {
  profil: {
    auteur: "L'équipe a remplacé ton pseudo par un pseudo neutre et retiré ton avatar : ils ne respectaient pas une règle de la communauté. Tu peux choisir un nouveau pseudo dans Profil › Modifier mon profil › Mes infos.",
    signale: "L'équipe t'a donné raison : son pseudo et son avatar ont été remis par défaut. Merci de veiller au grain !",
  },
  sortie: { auteur: "L'équipe a remis le titre de ta sortie par défaut : il ne respectait pas une règle de la communauté.", signale: "L'équipe t'a donné raison : le titre de la sortie a été remis par défaut. Merci de veiller au grain !" },
  groupe: { auteur: "L'équipe a effacé le titre de ton groupe : il ne respectait pas une règle de la communauté.", signale: "L'équipe t'a donné raison : le titre du groupe a été effacé. Merci de veiller au grain !" },
};

export const TEXTES_DECISIONS_MODERATION = {
  cibles: CIBLES,
  cibleInconnue: { nom: "contenu", feminin: false } as TexteCibleDecision,
  remisParDefaut: REMIS_PAR_DEFAUT,
  quoiAuteur: (nom: string, feminin: boolean) => `${feminin ? "Ta" : "Ton"} ${nom}`,
  quoiSignale: (nom: string, feminin: boolean) => `Ton signalement ${feminin ? "d'une" : "d'un"} ${nom}`,
  leContenu: (nom: string, feminin: boolean) => `${feminin ? "la" : "le"} ${nom}`,
  statutRemis: "Remis par défaut",
  statutMasque: (feminin: boolean) => `Masqué${feminin ? "e" : ""} en attendant la modération`,
  phraseMasque: (feminin: boolean) =>
    `${feminin ? "Elle" : "Il"} est caché${feminin ? "e" : ""} pour tout le monde, le temps qu'une personne de l'équipe ${feminin ? "la" : "le"} regarde de près.`,
  statutRetire: (feminin: boolean) => `Retiré${feminin ? "e" : ""}`,
  phraseRetireAuteur: (feminin: boolean) => `L'équipe l'a retiré${feminin ? "e" : ""} : ${feminin ? "elle" : "il"} ne respectait pas une règle de la communauté.`,
  statutDeRetour: "De retour en ligne",
  phraseDeRetour: (feminin: boolean) =>
    `Bonne nouvelle : l'équipe a tout relu, ${feminin ? "elle" : "il"} respecte les règles de la communauté. ${feminin ? "Elle" : "Il"} est de nouveau visible pour tout le monde.`,
  statutRienARedire: (feminin: boolean) => `Rien à redire, ${feminin ? "elle" : "il"} reste en ligne`,
  phraseRienARedireAuteur: (feminin: boolean) => `L'équipe a regardé de près : ${feminin ? "elle" : "il"} respecte les règles de la communauté.`,
  phraseRetireSignale: (leContenu: string, feminin: boolean) => `L'équipe t'a donné raison : ${leContenu} est retiré${feminin ? "e" : ""}. Merci de veiller au grain !`,
  phraseRienARedireSignale: (leContenu: string) => `L'équipe a regardé de près : ${leContenu} respecte les règles de la communauté. Merci quand même de nous l'avoir dit !`,
  statutEnAttente: "En attente de la modération",
  phraseEnAttente: (leContenu: string) => `Une personne de l'équipe va regarder ${leContenu} de près.`,
  regle: (libelle: string, regle: string) => `${libelle} : « ${regle} »`,
  regleInconnue: "une des règles de la communauté (nos conditions d'utilisation)",
  masqueLe: (date: string, feminin: boolean) => `Masqué${feminin ? "e" : ""} le ${date}`,
  decideLe: (date: string) => `Décidé le ${date}`,
  mentionEnvoyee: "Contestation envoyée : une autre personne de l'équipe réexamine.",
  mentionReexaminee: "Réexaminée : une autre personne de l'équipe a relu ta contestation, la décision ci-dessus est la sienne.",
  mentionDelaiPasse: "Le délai pour contester (6 mois) est passé.",
  luRegle: (regle: string) => `La règle en cause : ${regle}.`,
  luExplication: (motivation: string) => `L'explication de l'équipe : ${motivation}`,
  regleTitre: "La règle en cause",
  explicationTitre: "L'explication de l'équipe",
  contesterJusquau: (date: string) => `Tu peux contester jusqu'au ${date}.`,
  contester: "Contester",
  contesterDecisionLu: (quoi: string) => `Contester la décision sur ${quoi}`,
  contesterIndice: "Explique à l'équipe pourquoi tu n'es pas d'accord",
  limitation: {
    bientot: "bientôt",
    aPartirDu: (debut: string) => `À partir du ${debut}`,
    bientotPastille: "Bientôt",
    fini: "C'est fini",
    bloc: (titre: string, texte: string) => `${titre} : ${texte}`,
    contesterLu: "Contester la limitation de ton compte",
  },
};

export const TEXTES_DECISIONS_MODERATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DECISIONS_MODERATION>> = {
  fr: TEXTES_DECISIONS_MODERATION,
  en: TEXTES_DECISIONS_MODERATION_ANGLAIS,
};
