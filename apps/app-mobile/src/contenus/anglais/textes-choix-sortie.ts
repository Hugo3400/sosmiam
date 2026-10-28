import { MAX_PARTICIPANTS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CHOIX_SORTIE } from "~/contenus/textes-choix-sortie";

export const TEXTES_CHOIX_SORTIE_ANGLAIS: Traduction<typeof TEXTES_CHOIX_SORTIE> = {
  position: (position: number, total: number) => `${position} of ${total}`,
  emoji: {
    libelle: "Get-together emoji",
    noms: ["Restaurant", "Pizza", "Sushi", "Burger", "Brunch", "Cake", "Party", "Outdoors"],
  },
  finVote: "Voting ends",
  lieu: {
    fermer: "Close",
    fermerSansChoisir: "Close without choosing",
    chercher: "Search for a place",
    exempleRecherche: "A place, a dish, a neighbourhood…",
    aucun: "No places match – try another word.",
    dejaChoisi: "Already chosen",
  },
  participants: {
    bandeVide: "Your crew's empty for now. Add a friend and you'll be able to invite them.",
    ajouter: "Add a friend",
    maxInvites: (max: number) => `Up to ${max} guests per get-together`,
  },
  quand: {
    jourInexistant: "That day doesn't exist, not even in our tastiest dreams.",
    heureInvalide: "A time between 00:00 and 23:59, please.",
    jour: "Day",
    exempleJour: "DD/MM/YYYY",
    heure: "Time",
    exempleHeure: "HH:MM",
    valider: "Done",
    annuler: "Cancel",
    caseJour: "Day of the get-together",
    caseHeure: "Time of the get-together",
    indiceJour: "Opens the day picker",
    indiceHeure: "Opens the time picker",
    fermerSansChanger: "Close without changing anything",
    titreHeure: "What time?",
    titreJour: "Which day?",
    roulettes: "Spin the wheels – the crew will take care of the rest.",
    localeRoulettes: "en-GB",
  },
  inviter: {
    envoye: (prenoms: string, nombre: number) => `📨 Sent – ${prenoms} ${nombre === 1 ? "gets" : "get"} “You in?”`,
    titre: "Invite more friends",
    sousTitre: `The more, the merrier (and the hungrier). Up to ${MAX_PARTICIPANTS_SORTIE} people, including you.`,
    unInstant: "Just a sec…",
    inviterNombre: (nombre: number) => `Invite (${nombre})`,
    inviter: "Invite",
    indiceInviter: "Each of them gets “You in?”",
    annuler: "Cancel",
    fermer: "Close",
    complet: `The get-together is full: ${MAX_PARTICIPANTS_SORTIE} people, pending invitations included. Remove someone to make room.`,
    toutLeMonde: "Your whole crew's already in!",
    indiceMax: `Up to ${MAX_PARTICIPANTS_SORTIE} people per get-together, including you`,
  },
};
