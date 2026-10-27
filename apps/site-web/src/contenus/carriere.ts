import type { DomaineOffreCarriere, TypeOffreCarriere } from "../../../../packages/commun/src/types/carriere.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CANDIDATURE_ANGLAIS, TEXTES_CARRIERE_ANGLAIS, TEXTES_OFFRE_CARRIERE_ANGLAIS } from "~/contenus/anglais/carriere";

export const TAILLE_MAX_CV = 5 * 1024 * 1024;

export const LIMITE_ENVOI_CANDIDATURE = TAILLE_MAX_CV + 512 * 1024;

export const TYPES_OFFRE: readonly TypeOffreCarriere[] = ["benevolat", "freelance"];

export const EMOJIS_DOMAINES: Record<DomaineOffreCarriere, string> = {
  moderation: "🛡️",
  "reseaux-sociaux": "📣",
  graphisme: "🎨",
  video: "🎬",
  developpement: "💻",
  autre: "✨",
};

export const EMOJIS_ESPRIT = ["🏘️", "🛟", "🧡"] as const;

export const EMOJIS_FORMULES = { benevolat: "🙌", freelance: "🧑‍🎨" } as const;

export const EMOJIS_LISTES_OFFRE = { missions: "🎯", profil: "🔎", enEchange: "🎁" } as const;

export const LIMITES_CANDIDATURE = {
  nom: { minimum: 2, maximum: 80 },
  email: { maximum: 254 },
  message: { minimum: 20, maximum: 3000 },
  lien: { maximum: 300 },
} as const;

export const TEXTES_CARRIERE = {
  titreMeta: "On recrute : bénévoles et freelances",
  description:
    "Rejoins SOS Miam : bénévolat (modération, réseaux sociaux) ou freelance (graphisme, vidéo, développement), à distance, partout en France, dès 18 ans.",
  sujetMail: "Je veux rejoindre SOS Miam",
  ecrisNous: "Écris-nous",
  types: {
    benevolat: { libelle: "Bénévolat", aucuneOffre: "Pas d'offre de bénévolat en ce moment" },
    freelance: { libelle: "Freelance ou mission", aucuneOffre: "Pas d'offre de freelance ou de mission en ce moment" },
  },
  domaines: {
    moderation: "Modération",
    "reseaux-sociaux": "Réseaux sociaux",
    graphisme: "Graphisme et illustration",
    video: "Vidéo et montage",
    developpement: "Développement",
    autre: "Coup de main",
  },
  enTete: {
    titre: "On recrute !",
    badge: "Carrière",
    chapo:
      "SOS Miam aide à trouver les restos, bars et pâtisseries indépendants de ton quartier, et donne un coup de main aux lieux en SOS. Gratuit pour les Miamis comme pour les lieux, et fait avec beaucoup d'amour (et un peu de gourmandise).",
    franchise: "On est une petite équipe, pas encore une entreprise : on cherche des bénévoles et des freelances.",
    pourToutes: "Pour toutes les offres",
    pourTous: ["À distance, partout en France", "Dès 18 ans", "Ni stage, ni alternance, ni emploi pour l'instant"],
    voirOffres: "Voir les offres",
    espritTitre: "L'esprit SOS Miam",
    esprit: [
      { titre: "Le quartier d'abord", texte: "On met en avant les adresses indépendantes, celles qui font le sel d'une rue." },
      { titre: "La Brigade à la rescousse", texte: "Quand un lieu lance un SOS, les Miamis débarquent à table. Un vrai coup de main, jamais de la pitié." },
      { titre: "Bonne humeur de rigueur", texte: "On se tutoie, on rit beaucoup, et on prend soin les uns des autres." },
    ],
  },
  liste: {
    titre: "Les offres ouvertes",
    filtrer: "Filtrer les offres",
    toutes: "Toutes",
    nombreOffres: (nombre: number) => (nombre > 1 ? " offres" : " offre"),
    affichees: (nombre: number) => (nombre === 1 ? "1 offre affichée" : `${nombre} offres affichées`),
  },
  carte: {
    publiee: (date: string) => ` · publiée le ${date}`,
    voirOffre: "Voir l'offre →",
  },
  etats: {
    vide: { titre: "Pas d'offre en ce moment", texte: "Repasse bientôt, ou écris-nous : on lit tous les messages, même ceux qui ne répondent à aucune annonce." },
    filtreVide: "Jette un œil aux autres offres, ou écris-nous si tu as une idée en tête.",
    indisponible: { titre: "Les offres font une petite sieste", texte: "Notre serveur ne répond pas pour l'instant. Repasse dans un instant, ou écris-nous." },
    voirToutes: "Voir toutes les offres",
  },
  formules: {
    titre: "Bénévole ou freelance ?",
    chapo: "Deux façons de nous rejoindre, toutes les deux à distance, partout en France, dès 18 ans.",
    enEchange: "En échange",
    benevolat: {
      titre: "Bénévolat",
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
      texte: "Graphisme et illustration, vidéo et montage, développement : une mission précise, avec un début et une fin.",
      recois: ["Une rémunération sur devis : pas de montant affiché, c'est toi qui proposes ton tarif"],
    },
    pasDOffre: "Pas d'offre pour toi, mais une envie qui te démange ? ",
    ecrisNousA: (email: string) => `Écris-nous à ${email}`,
  },
};

export const TEXTES_OFFRE_CARRIERE = {
  offre: "Offre",
  resumeParDefaut: (type: string, lieu: string) => `${type} chez SOS Miam, ${lieu}.`,
  introuvableMeta: "Offre introuvable — SOS Miam",
  accueil: "Accueil",
  onRecrute: "On recrute",
  toutesLesOffres: "Toutes les offres",
  reperes: {
    formule: "Formule",
    domaine: "Domaine",
    ou: "Où",
    age: "Âge",
    desDixHuitAns: "Dès 18 ans",
    remuneration: "Rémunération",
    surDevis: "Sur devis : tu proposes ton tarif",
    publieeLe: "Publiée le",
  },
  jeCandidate: "Je candidate",
  enQuelquesMots: "L'offre en quelques mots",
  listes: { missions: "Tes missions", profil: "Ton profil", enEchange: "En échange" },
  candidaterChapo: "Pas besoin d'une lettre de motivation au cordeau : dis-nous simplement qui tu es et ce qui te donne envie.",
  merci: {
    titre: "Merci, c'est envoyé !",
    arrivee: (titre: string) => `Ta candidature pour « ${titre} » est bien arrivée.`,
    conservation: "Elle est gardée 6 mois, puis effacée. En attendant, la Brigade te fait un grand salut.",
    voirAutres: "Voir les autres offres",
    retourAccueil: "Retour à l'accueil",
  },
  absente: {
    introuvable: {
      titre: "Cette offre a pris le large",
      texte: "Elle est peut-être déjà pourvue, ou elle n'a jamais existé. Si tu étais en train de candidater, rien n'est parti : jette un œil aux autres offres.",
    },
    indisponible: {
      titre: "Les offres font une petite sieste",
      texte: "Notre serveur ne répond pas pour l'instant. Repasse dans un instant, ou écris-nous.",
    },
    voirOffres: "Voir les offres",
  },
};

export type ChampCandidature = "nom" | "email" | "message" | "lien" | "cv" | "majeur";

export const champsCandidature = {
  nom: {
    libelle: "Ton prénom et ton nom",
    erreur: "Dis-nous comment tu t'appelles (2 à 80 caractères).",
  },
  email: {
    libelle: "Ton e-mail",
    exemple: "ton@email.fr",
    erreur: "Cette adresse e-mail ne semble pas valide.",
  },
  message: {
    libelle: "Ton message",
    aide: "Qui tu es, ce qui te donne envie, ce que tu aimerais faire avec nous (20 caractères au moins).",
    erreur: "Écris-nous un message de 20 à 3 000 caractères.",
  },
  lien: {
    libelle: "Un lien vers ton travail",
    aide: "Portfolio, Behance, GitHub, chaîne vidéo, compte Instagram…",
    exemple: "https://monportfolio.fr",
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
};

export const TEXTES_CANDIDATURE = {
  champs: champsCandidature,
  facultatif: " (facultatif)",
  compteur: (longueur: number, maximum: number) => `${longueur} / ${maximum} caractères`,
  retirerFichier: "Retirer le fichier",
  piege: "Ne remplis pas ce champ",
  conservation: "Ta candidature est gardée 6 mois puis effacée ; seule l'équipe la lit. ",
  enSavoirPlus: "En savoir plus",
  envoi: "Envoi…",
  envoyer: "Envoyer ma candidature",
  messages: {
    unChamp: "Un champ est à corriger.",
    plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
    champInconnu: "Un champ ne va pas : vérifie le formulaire.",
    tropDEnvois: "Doucement ! Trop d'envois d'affilée : réessaie dans un moment, ou écris-nous à bonjour@sosmiam.fr.",
    erreur: "Oups, ta candidature n'est pas partie. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
    tropLourd: "Ton envoi est trop lourd : ton CV doit faire 5 Mo au plus. Ajoute-le de nouveau, allégé.",
    merci: "On lit chaque candidature, pour de vrai. Si ça colle, on t'écrit à l'adresse que tu nous as donnée.",
  },
};

export const TEXTES_CARRIERE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARRIERE>> = {
  fr: TEXTES_CARRIERE,
  en: TEXTES_CARRIERE_ANGLAIS,
};

export const TEXTES_OFFRE_CARRIERE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_OFFRE_CARRIERE>> = {
  fr: TEXTES_OFFRE_CARRIERE,
  en: TEXTES_OFFRE_CARRIERE_ANGLAIS,
};

export const TEXTES_CANDIDATURE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CANDIDATURE>> = {
  fr: TEXTES_CANDIDATURE,
  en: TEXTES_CANDIDATURE_ANGLAIS,
};
