import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_FIL_ANGLAIS } from "~/contenus/anglais/textes-fil";

export const TEXTES_FIL = {
  compteCree: "Compte créé ! À toi de jouer 💛",
  pasInteresse: "Compris, on t'en montrera moins comme ça 🙈",
  partage: (emoji: string, nom: string, quartier: string) => `${emoji} ${nom} (${quartier}) a besoin de monde ! Je l'ai trouvé sur SOS Miam 🛟 https://sosmiam.fr`,
  ceLieuDebut: "Ce lieu",
  ceLieu: "ce lieu",
  garde: (nom: string) => `🔖 ${nom} est gardé pour plus tard`,
  retireGardes: "Retiré de tes lieux gardés",
  enTete: {
    onglets: {
      abonnements: { libelle: "Abonnements", mini: "Suivis", lu: "Abonnements" },
      tous: { libelle: "Pour toi", lu: "Pour toi" },
      sos: { libelle: "SOS ce soir 🔥", court: "SOS 🔥", lu: "SOS ce soir" },
    },
    ongletLu: (lu: string, position: number, total: number) => `${lu}, onglet ${position} sur ${total}`,
    rescoussesRestantes: (n: number) => `Il te reste ${n} rescousse${n > 1 ? "s" : ""} cette semaine`,
    visiteLu: "Visite sans compte. Crée ton compte",
    visiteIndice: "Une minute, et à toi les rescousses, les J'aime et les commentaires",
    visite: "👀 Visite · ",
    creerCompte: "Crée ton compte",
  },
  videSos: {
    titre: "Calme plat ce soir",
    texte: "Aucun lieu n'a lancé de SOS pour l'instant. Garde ton appétit au chaud : on te prévient dès qu'une table se libère près de chez toi.",
    bouton: "Voir toutes les adresses",
  },
  videAbonnements: {
    titre: "Ton fil Abonnements fait la sieste 😴",
    texte: "Suis des lieux et des créateurs : leurs vidéos arriveront ici.",
    personnes: "Les personnes que tu suis ne publient pas encore de vidéos : leurs listes t'attendent dans Potes.",
    retour: "Retour à Pour toi",
    indiceRetour: "Revient au fil de toutes les adresses",
  },
  videPourToi: {
    horsLigneTitre: "Pas de réseau",
    titre: "Le fil chauffe encore",
    horsLigneTexte: "Impossible de charger le fil pour l'instant. Il revient dès que ta connexion aussi !",
    texte: "Les lieux préparent leurs premières vidéos. En attendant, leurs adresses t'attendent dans Explorer : va leur dire bonjour !",
    bouton: "Voir les adresses",
  },
  media: {
    sonOn: "Mettre le son",
    sonOff: "Couper le son",
    avancer: "Avancer de 2 secondes",
    reculer: "Reculer de 2 secondes",
    vitesseDouble: "2x",
    avanceeVideo: "Avancée de la vidéo",
    secondesLues: (lues: number, total: number) => `${lues} seconde${lues > 1 ? "s" : ""} sur ${total}`,
    photoSuivante: "Photo suivante",
    photoPrecedente: "Photo précédente",
    photo: "Photo",
    positionPhoto: (actuelle: number, total: number) => `${actuelle} sur ${total}`,
  },
  legende: {
    plus: "plus",
    moins: "moins",
    indiceReplier: "Replie la légende",
    indiceDeplier: "Affiche toute la légende",
  },
  auteur: {
    voirPage: (nom: string) => `Voir la page de ${nom}`,
    voirFiche: (nom: string) => `Voir la fiche de ${nom}`,
  },
};

export const TEXTES_FIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FIL>> = { fr: TEXTES_FIL, en: TEXTES_FIL_ANGLAIS };
