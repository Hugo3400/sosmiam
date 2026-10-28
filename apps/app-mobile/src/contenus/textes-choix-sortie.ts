import { MAX_PARTICIPANTS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CHOIX_SORTIE_ANGLAIS } from "~/contenus/anglais/textes-choix-sortie";

export const TEXTES_CHOIX_SORTIE = {
  position: (position: number, total: number) => `${position} sur ${total}`,
  emoji: {
    libelle: "Emoji de la sortie",
    noms: ["Resto", "Pizza", "Sushis", "Burger", "Brunch", "Goûter", "Fête", "Grand air"],
  },
  finVote: "Fin du vote",
  lieu: {
    fermer: "Fermer",
    fermerSansChoisir: "Fermer sans choisir",
    chercher: "Chercher un lieu",
    exempleRecherche: "Un lieu, un plat, un quartier…",
    aucun: "Aucun lieu ne correspond, essaie un autre mot.",
    dejaChoisi: "Déjà choisi",
  },
  participants: {
    bandeVide: "Ta bande est vide pour l'instant : ajoute un pote, et tu pourras l'inviter.",
    ajouter: "Ajouter un pote",
    maxInvites: (max: number) => `${max} invités au plus par sortie`,
  },
  quand: {
    jourInexistant: "Ce jour n'existe pas, même dans nos rêves les plus gourmands.",
    heureInvalide: "Une heure entre 00:00 et 23:59, s'il te plaît.",
    jour: "Le jour",
    exempleJour: "JJ/MM/AAAA",
    heure: "L'heure",
    exempleHeure: "HH:MM",
    valider: "Valider",
    annuler: "Annuler",
    caseJour: "Jour de la sortie",
    caseHeure: "Heure de la sortie",
    indiceJour: "Ouvre le choix du jour",
    indiceHeure: "Ouvre le choix de l'heure",
    fermerSansChanger: "Fermer sans rien changer",
    titreHeure: "À quelle heure ?",
    titreJour: "Quel jour ?",
    roulettes: "Fais tourner les roulettes, la bande s'occupe du reste.",
    localeRoulettes: "fr-FR",
  },
  inviter: {
    envoye: (prenoms: string, nombre: number) => `📨 C'est envoyé : ${prenoms} ${nombre > 1 ? "reçoivent" : "reçoit"} « Tu viens ? »`,
    titre: "Inviter d'autres potes",
    sousTitre: `Plus on est de fous, plus on mange. ${MAX_PARTICIPANTS_SORTIE} personnes au plus, toi compris.`,
    unInstant: "Un instant…",
    inviterNombre: (nombre: number) => `Inviter (${nombre})`,
    inviter: "Inviter",
    indiceInviter: "Chacun reçoit « Tu viens ? »",
    annuler: "Annuler",
    fermer: "Fermer",
    complet: `La sortie affiche complet : ${MAX_PARTICIPANTS_SORTIE} personnes, invitations en attente comprises. Retire quelqu'un pour faire de la place.`,
    toutLeMonde: "Toute ta bande est déjà dans le coup !",
    indiceMax: `${MAX_PARTICIPANTS_SORTIE} personnes au plus par sortie, toi compris`,
  },
};

export const TEXTES_CHOIX_SORTIE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHOIX_SORTIE>> = { fr: TEXTES_CHOIX_SORTIE, en: TEXTES_CHOIX_SORTIE_ANGLAIS };
