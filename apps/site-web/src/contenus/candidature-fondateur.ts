import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CANDIDATURE_FONDATEUR_ANGLAIS } from "~/contenus/anglais/candidature-fondateur";
import { ecrireNumeroFondateur } from "~/fonctions/fondateurs/ecrire-numero-fondateur";
import type { CandidatureFondateur, ZoneFondateurs } from "~/types/compte";

export const TEXTES_CANDIDATURE_FONDATEUR = {
  meta: { titre: "Devenir fondateur", description: "Candidate pour être l'un des fondateurs de ta ville." },
  titre: "Les fondateurs de ta ville",
  chapo: "Dans chaque ville, des ambassadeurs lancent l'aventure avec nous : plus ou moins de places selon la taille de la ville, et une place par département pour les plus petites communes.",
  messages: {
    pepites: "Parle-nous de tes 3 pépites, en 20 à 1500 caractères.",
    envies: "Coche au moins une chose que tu aimerais faire.",
    reseaux: "Tes réseaux font 200 caractères au plus.",
    motivation: "Dis-nous pourquoi toi, en 20 à 600 caractères.",
    connuPar: "Cette réponse fait 120 caractères au plus.",
  },
  communeDAbord: "Choisis d'abord ta commune, juste au-dessus.",
  refus: {
    "candidature-existante": "Tu as déjà une candidature : pas besoin d'en envoyer une autre.",
    "plus-de-place": "Toutes les places de ta ville viennent d'être prises. Elle rouvrira dès qu'une place se libère.",
    "champ-invalide": "Choisis ta commune dans la liste, puis réessaie.",
    "deja-traitee": "L'équipe a déjà répondu à ta candidature : sa commune ne peut plus changer.",
    "aucune-candidature": "On ne trouve pas ta candidature : recharge la page.",
    "trop-de-demandes": "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes.",
  },
  panne: "Oups, ça n'est pas passé. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  choix: {
    titres: { candidater: "1. Ta commune", preciser: "Précise ta commune", changer: "Change de commune" },
    textes: {
      candidater: "Là où tu vis. Si ta commune a moins de 50 000 habitants, tu candidates pour ton département (ou ta collectivité d'outre-mer).",
      preciser: "Ta candidature est arrivée avant les fondateurs par ville : dis-nous où tu vis, pour qu'elle compte pour ta ville (ou ton département).",
      changer: "Tant que l'équipe n'a pas répondu, ta candidature peut changer de commune.",
    },
    libelle: "Ta commune",
    aide: "Son nom ou ton code postal.",
    bouton: "Voir les places",
    garder: "Garder ma commune",
    titreCandidature: "2. Ta candidature",
    choisir: (nom: string) => `Choisir ${nom}`,
    comptera: (zone: ZoneFondateurs) => `Ta candidature comptera pour ${zone.type === "ville" ? zone.nom : `ton département (${zone.nom})`}.`,
  },
  complet: {
    titreVille: "Toutes les places de ta ville sont prises",
    titreZone: (zone: ZoneFondateurs) => `La place ${zone.nomAvecDe} est prise`,
    texte: (zone: ZoneFondateurs) =>
      `Merci d'avoir tenté ta chance ! La candidature ${zone.nomAvecDe} rouvrira dès qu'une place se libère : pas de liste d'attente, repasse de temps en temps. En attendant, tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.`,
    trompe: "Tu t'es trompé de commune ? ",
    autre: "Choisis-en une autre",
  },
  formulaire: {
    bouton: "Envoyer ma candidature",
    envies: {
      denicher: "Dénicher des lieux",
      fiches: "Tenir les fiches à jour",
      selections: "Créer des sélections",
      "faire-savoir": "Parler de SOS Miam autour de toi",
    },
    pepites: "Tes 3 pépites, et pourquoi",
    aidePepites: "Trois lieux indépendants que tu adores, et ce qui les rend uniques (20 caractères au moins).",
    legendeEnvies: "Ce que tu aimerais faire",
    aideEnvies: "Coche tout ce qui te tente (une case au moins).",
    reseaux: "Tes réseaux",
    aideReseaux: "Ton Instagram, ton TikTok… si tu veux nous les montrer.",
    motivation: "Pourquoi toi ?",
    aideMotivation: "En quelques lignes (20 caractères au moins).",
    rencontre: "Partant pour une visio d'environ 30 minutes avec les fondateurs de ta ville (de ta région pour un département)",
    connuPar: "Comment tu as connu SOS Miam ?",
  },
  presentation: {
    titre: "Les fondateurs de ta ville",
    texte: "Ce sont les premiers ambassadeurs de chaque ville : ils dénichent les premières pépites et lancent SOS Miam avec nous, partout en France.",
    recoivent: "Ce qu'ils reçoivent",
    conclusion:
      "C'est un programme de passionnés : pas de rémunération, ni horaires ni objectifs. Pas retenu ? Tu restes ambassadeur, tu grimpes les niveaux comme tout le monde, et tu peux recandidater quand tu veux.",
  },
  etat: {
    numero: (candidature: Pick<CandidatureFondateur, "numeroLocal" | "numeroNational" | "zone">) => ecrireNumeroFondateur(candidature),
    souvenir: (numero: number | null, zone: ZoneFondateurs | null) => `Tu as été fondateur${numero ? ` n° ${numero}` : ""}${zone ? ` ${zone.nomAvecDe}` : ""}`,
    accepte: (zone: ZoneFondateurs | null) => `Tu fais partie des fondateurs${zone ? ` ${zone.nomAvecDe}` : ""} !`,
    sujetDemenagement: "Je déménage (fondateur SOS Miam)",
    texteSouvenir: "Ta place s'est libérée pour quelqu'un d'autre, mais ton titre et ton numéro restent à toi. Tu as une nouvelle ville ? Tu peux y candidater juste en dessous.",
    demenage: "Tu déménages ? ",
    ecrisNous: "Écris-nous",
    suiteDemenage: " : ta place se libère, tu gardes ton titre en souvenir.",
    titreRefus: "Ta candidature n'a pas été retenue",
    refus: "Merci d'avoir tenté ta chance ! Les places de fondateur sont très peu nombreuses. Tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde. Et tu peux recandidater tout de suite, juste en dessous.",
    effaceeDebut: "Ta candidature sera effacée trois mois après la réponse, au plus tard le ",
    effaceeFin: ".",
    note: "C'est noté !",
    arrivee: "Ta candidature est bien arrivée",
    envoyeeLe: "Envoyée le ",
    lue: "L'équipe la lit avec attention : tu verras sa réponse ici.",
    pasLaBonne: "Pas la bonne commune ? ",
    changer: "Changer de commune",
  },
  carte: {
    titre: "Ta carte de fondateur",
    texte: "À garder, à imprimer ou à partager. Une vraie carte t'arrivera par la poste plus tard.",
    apercu: (numero: string) => `Aperçu de ta carte : ${numero}`,
    legende: "Sur ta carte, il est écrit",
    fondateur: "Fondateur",
    fondatrice: "Fondatrice",
    telecharger: "Télécharger ma carte",
    preparation: "Préparation…",
    png: "En image PNG",
    erreurPng: "Le PNG n'a pas pu être préparé : télécharge la carte en SVG, ou réessaie.",
  },
};

export const TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CANDIDATURE_FONDATEUR>> = {
  fr: TEXTES_CANDIDATURE_FONDATEUR,
  en: TEXTES_CANDIDATURE_FONDATEUR_ANGLAIS,
};
