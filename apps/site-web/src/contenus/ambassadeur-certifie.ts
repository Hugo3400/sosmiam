// Ambassadeur certifié (docs/decisions.md, « Ambassadeur certifié », validé par Hugo le 9 octobre 2026) : les choix du
// formulaire de candidature de /espace/certification, avec les mêmes codes que l'API (POST /comptes/moi/certification).
// La présentation (qui, comment, ce qu'on a de plus) est dans programme-ambassadeur.ts, partagée avec /programme.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_AMBASSADEUR_CERTIFIE_ANGLAIS } from "~/contenus/anglais/ambassadeur-certifie";

/** Longueurs maximales, les mêmes que l'API */
export const AIDE_MAX = 600;
export const STRUCTURE_MAX = 100;

export const TEXTES_AMBASSADEUR_CERTIFIE = {
  meta: { titre: "Ambassadeur certifié", description: "Candidate pour devenir ambassadeur certifié SOS Miam." },
  profils: {
    ambassadeur: "Un ambassadeur qui aime aider les lieux",
    pro: "Un pro (resto, commerce…)",
    structure: "Une structure (asso, mairie, office de tourisme, école…)",
  },
  envies: {
    fiche: "Aider un lieu à remplir sa fiche",
    photos: "Faire de belles photos",
    presenter: "Présenter SOS Miam aux lieux du coin",
    "big-sos": "Donner un coup de main pendant un BIG SOS",
  },
  engagement: "J'ai compris : je ne suis jamais payé par un lieu (sinon j'écris « Collaboration commerciale »)",
  messages: {
    profil: "Dis-nous si tu es plutôt ambassadeur, pro ou structure.",
    structure: (maximum: number) => `Le nom de ta structure fait ${maximum} caractères au plus.`,
    ville: "Tape le nom de ta commune ou ton code postal, puis choisis-la.",
    aide: (maximum: number) => `Raconte-nous en quelques mots comment tu aides les lieux (${maximum} caractères au plus).`,
    envies: "Coche au moins une chose que tu aimerais faire.",
    engagementGratuit: "Coche cette case pour envoyer ta candidature : c'est la règle de tous les ambassadeurs.",
    plusieursCommunes: "Plusieurs communes correspondent : choisis la tienne juste en dessous.",
  },
  refus: {
    "candidature-existante": "Ta candidature est déjà à l'étude : pas besoin d'en envoyer une autre.",
    "deja-certifie": "Tu es déjà ambassadeur certifié : recharge la page pour retrouver ton kit média pro.",
    "trop-de-demandes": "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes.",
  },
  panne: "Oups, ça n'est pas passé. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  formulaire: {
    titre: "Ta candidature",
    bouton: "Envoyer ma candidature",
    profil: "Tu es plutôt…",
    structure: "Nom de ta structure ou de ton lieu",
    aideStructure: "Il s'affichera avec ton prénom sur les fiches des lieux que tu aides : « Marie, pour l'asso Les Gourmands du 11e ».",
    ville: "Ta ville",
    aideVille: "Là où tu vis : tape son nom ou ton code postal, puis choisis-la.",
    aide: "Comment tu aides déjà les lieux ?",
    aideAide: "Une fiche remplie, des photos, un coup de main au marché, une asso de quartier… raconte !",
    envies: "Ce que tu aimerais faire",
    aideEnvies: "Coche tout ce qui te tente (une case au moins).",
  },
  ajout: "Ce titre s'ajoute à ton niveau (et à ton titre de fondateur si tu en as un) : c'est toujours un programme de passionnés, sans rémunération, ni horaires ni objectifs.",
  etat: {
    certifie: "Tu es ambassadeur certifié ✓",
    depuis: "Depuis le ",
    pour: ", pour ",
    texteCertifie: "Ton badge s'affiche sur les fiches des lieux que tu aides. L'équipe te confie des missions chez les lieux partenaires : elles arrivent dans « Mes missions ».",
    monKitPro: "Mon kit média pro",
    mesMissions: "Mes missions",
    arrivee: "Ta candidature est arrivée !",
    envoyeeLe: "Envoyée le ",
    lue: "L'équipe la lit avec attention : tu verras sa réponse ici.",
    termes: { profil: "Tu es plutôt", structure: "Ta structure ou ton lieu", ville: "Ta ville", envies: "Ce que tu aimerais faire" },
    titreRefus: "Ta candidature n'a pas été retenue, cette fois",
    refus: "Merci d'avoir proposé ton aide ! Tu restes ambassadeur, comme avant. Et tu peux recandidater tout de suite, juste en dessous : par exemple quand tu auras aidé un ou deux lieux de plus.",
    effaceeDebut: "Cette candidature sera effacée trois mois après la réponse, au plus tard le ",
    effaceeFin: ".",
    titreRetire: "Ton titre d'ambassadeur certifié n'est plus actif",
    retire: "Tu restes ambassadeur, avec ton niveau et tes badges. Si tu veux de nouveau aider les lieux comme certifié, tu peux recandidater juste en dessous.",
  },
};

export const TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AMBASSADEUR_CERTIFIE>> = {
  fr: TEXTES_AMBASSADEUR_CERTIFIE,
  en: TEXTES_AMBASSADEUR_CERTIFIE_ANGLAIS,
};
