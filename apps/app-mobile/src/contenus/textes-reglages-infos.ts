import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_INFOS_ANGLAIS } from "~/contenus/anglais/textes-reglages-infos";

export const TEXTES_REGLAGES_INFOS = {
  reglesPseudo:
    "De 3 à 20 caractères : lettres minuscules sans accents, chiffres, point ou tiret bas (pas au début ni à la fin, et jamais deux d'affilée).",
  pseudoSansCompte: "Sans compte, il reste sur ce téléphone : c'est avec un compte qu'on vérifie qu'il est libre.",
  dateAvecCompte:
    "Elle ne se change pas d'ici : c'est elle qui confirme que tu as l'âge d'être sur SOS Miam. Une erreur ? Écris-nous à bonjour@sosmiam.fr, on la corrige avec toi.",
  dateSurTelephone:
    "Elle ne se change pas d'ici : c'est elle qui confirme que tu as l'âge d'être sur SOS Miam. Une erreur ? Ce profil n'existe que sur ton téléphone, on ne peut pas la corriger de notre côté. La seule solution : « Effacer mes données et recommencer », dans Paramètres › Tes données (le reste repart aussi à zéro).",
  prenomVide: "Il nous faut au moins ton prénom pour te dire bonjour !",
  garderPseudo: "Garde un pseudo : c'est grâce à lui que tes potes te trouvent.",
  aideSansCompteAvecPseudo: "C'est avec lui que tes potes te trouvent (ton lien d'invitation et ton QR code suivront s'il change).",
  aideSansCompteSansPseudo:
    "Tu n'en as pas encore : choisis-en un pour que tes potes te trouvent. 3 à 20 caractères, en minuscules, chiffres, point ou tiret bas.",
  pseudoInterdit: "Ce pseudo-là ne passera pas : choisis-en un plus sympa.",
  pseudoPropose: (pseudo: string) => `Pseudo proposé : ${pseudo}`,
  rateTitre: "Oups, ça a coincé",
  rateTexte: "Tes infos n'ont pas pu être enregistrées. Réessaie dans un instant.",
  titre: "Mes infos",
  sousTitre: "Juste de quoi te saluer par ton prénom et te dénicher des bons plans près de chez toi.",
  unInstant: "Un instant…",
  enregistrer: "Enregistrer",
  enregistrerIndice: "Enregistre tes infos et revient à l'écran d'avant",
  prenom: "Ton prénom",
  prenomExemple: "Camille",
  pseudo: "Ton pseudo",
  pseudoExemple: "camille42",
  autreIdeeLu: "Une autre idée de pseudo",
  proposerLu: "Me proposer un pseudo",
  proposerIndice: "Remplace ton pseudo par une proposition, à partir de ton prénom",
  autreIdee: "🎲 Une autre idée",
  proposer: "🎲 Me proposer un pseudo",
  nom: "Ton nom",
  facultatif: "facultatif",
  nomAide: "Tu peux le laisser vide, on ne le prendra pas mal.",
  nomExemple: "Dupont",
  dateLue: (date: string, age: number, explication: string) => `Ta date de naissance : ${date}, ${age} ans. ${explication}`,
  dateTitre: "Ta date de naissance",
  dateValeur: (date: string, age: number) => `${date} · ${age} ans`,
  pseudoPris: (titre: string, texte: string) => `${titre} ! ${texte}`,
} as const;

export const TEXTES_REGLAGES_INFOS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_INFOS>> = { fr: TEXTES_REGLAGES_INFOS, en: TEXTES_REGLAGES_INFOS_ANGLAIS };
