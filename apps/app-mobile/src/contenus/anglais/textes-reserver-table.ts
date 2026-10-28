import type { Traduction } from "@sos-miam/commun/types/traduction";

import type {
  ACTIONS_REFUS_RESERVATION,
  MOMENTS_CRENEAUX,
  PETIT_MOT_REFUSE,
  SANS_CRENEAU,
  TEXTES_DEMANDE_ENVOYEE,
  TEXTES_HORAIRES_SECOURS,
  TEXTES_PLAN_B,
  TEXTES_REFUS_RESERVATION,
  TEXTES_RESERVER_TABLE,
  TROP_TARD_VEILLE,
} from "~/contenus/textes-reserver-table";

export const TEXTES_RESERVER_TABLE_ANGLAIS: Traduction<typeof TEXTES_RESERVER_TABLE> = {
  titre: "Book a table",
  titreSortie: "Book your spot",
  sousTitre: "Free, no card needed – the staff reply right here in the app.",
  sousTitreAuto: "Free, no card needed, and confirmed straight away if there's room.",
  confirmationImmediate: "⚡ Instant confirmation",
  confirmationImmediateLu: "Instant confirmation if there's room",
  jour: "Which day?",
  heure: "What time?",
  heureDeParis: "These are the place's times, in Paris time.",
  personnes: "How many of you?",
  personnesLu: "Number of people",
  grandeTablee: "More than {max}? Call the place directly – big groups are best sorted over the phone.",
  petitMot: "A note for the staff",
  petitMotMention: "optional",
  petitMotExemple: "Could we have a high chair for Léon?",
  petitMotAide: "The staff read it with your request",
  recapTitre: "Your request",
  recapTitreAuto: "Your booking",
  recapSansPetitMot: "No note",
  recapSecours: "Otherwise {heures}",
  recapNote: "Free, no card needed. With no reply {minutes} min before the slot, the request quietly expires.",
  recapNotePlanB: "Free, no card needed. With no reply {minutes} min before your earliest time, the request quietly expires.",
  recapNoteAuto: "Free, no card needed. Confirmed straight away if there's room.",
  envoyer: "Send my request",
  envoyerAutoTable: "Book my table",
  envoyerAutoPlace: "Book my spot",
  envoyerSansPetitMot: "Send without a note",
  envoi: "Sending…",
  envoiAuto: "Booking…",
  indiceEnvoyer: "Sends your request to the place, and they'll reply in the app",
  indiceEnvoyerAuto: "Books straight away if there's room",
  indiceSansHeure: "Choose the day and time first",
  prochainJourOuvert: "See the next day with room",
  indiceProchainJourOuvert: "Picks the next day that still has a time for you",
  chargementCreneaux: "Looking for free tables…",
  horsLigneCreneauxTitre: "No signal, no tables",
  horsLigneCreneauxTexte: "We can't see the free times. Check your connection, then try again – your choices are waiting right here.",
  reessayer: "Try again",
  indiceReessayer: "Reloads the free times",
  horsLigneCourt: "No signal – these times may be a little out of date.",
  serviceComplet: "Fully booked for {personnes}. Fewer of you, or another day?",
  serviceTropTard: "Too late for this service – here, you need to book at least {delai} ahead.",
  serviceTropTardVeille: "Too late for this service – here, you need to book by the day before.",
  peuDePlaces: "filling up",
  sansHorairesTitre: "No opening hours here yet",
  sansHorairesTexte: "The staff {deLieu} haven't added their opening hours to the app yet, so we can't offer you a slot. Pop in or give them a call – they'll be delighted.",
  lieuIntrouvableTitre: "This place isn't here any more",
  lieuIntrouvableTexte: "It's not on SOS Miam for now. Plenty more gems are waiting in Explore.",
  voirExplorer: "Find more gems",
};

export const SANS_CRENEAU_ANGLAIS: Traduction<typeof SANS_CRENEAU> = {
  ferme: {
    emoji: "😴",
    court: "Closed",
    lu: "closed",
    titre: "Closed that day",
    texte: "The staff {deLieu} are recharging their batteries. Pick another day – they'll be ready and waiting for you.",
  },
  "sans-resa": {
    emoji: "🪑",
    court: "No bookings",
    lu: "no bookings that day",
    titre: "No bookings that day",
    texte: "The staff {deLieu} don't take bookings that day. Try your luck in person, or pick another day.",
  },
  complet: {
    emoji: "🫶",
    court: "Full",
    lu: "fully booked",
    titre: "Fully booked for {personnes}",
    texte: "A victim of its own success! Try another day, or with fewer people.",
  },
  "trop-tard": {
    emoji: "🌙",
    court: "Too late",
    lu: "too late to book",
    titre: "No slots left in time",
    texte: "Here, you book at least {delai} ahead, and today's last slot has gone. Fancy another day?",
  },
};

export const TROP_TARD_VEILLE_ANGLAIS: Traduction<typeof TROP_TARD_VEILLE> = "Here, you book by the day before at the latest – the staff like to plan ahead. How about tomorrow?";

export const MOMENTS_CRENEAUX_ANGLAIS: Traduction<typeof MOMENTS_CRENEAUX> = {
  matin: { emoji: "🌅", libelle: "Morning" },
  midi: { emoji: "☀️", libelle: "Lunchtime" },
  "apres-midi": { emoji: "🍰", libelle: "Afternoon" },
  soir: { emoji: "🌙", libelle: "Evening" },
};

export const TEXTES_PLAN_B_ANGLAIS: Traduction<typeof TEXTES_PLAN_B> = {
  ouvrir: "＋ Add a plan B",
  mention: "optional",
  ouvrirIndice: "Suggests 1 or 2 other times on the same day, just in case",
  titre: "A plan B?",
  texte: "Add 1 or 2 other times: if {heure} doesn't work, the staff can pick one of those instead.",
  texteAuto: "Add 1 or 2 other times: if {heure} gets snapped up while you're choosing, we'll grab the next one for you.",
  max: "2 plan Bs max – remove one to choose another.",
  vide: "No other free times that day – your first choice is the one.",
  fermer: "No plan B",
  indiceFermer: "Closes the plan B and clears it",
  indiceAjouter: "Tap to add it as a plan B",
  indiceRetirer: "Tap again to remove it",
  lu: "{heure}, plan B number {rang}",
  principalParti: "{heure} doesn't have enough room for {personnes} any more – pick another time.",
  secoursParti: "{heures} isn't free any more – we've taken it off your plan B.",
  secoursPartis: "{heures} aren't free any more – we've taken them off your plan B.",
};

export const TEXTES_REFUS_RESERVATION_ANGLAIS: Traduction<typeof TEXTES_REFUS_RESERVATION> = {
  "email-non-verifie": "To book, you need a confirmed email. Tap the link we sent you, or ask for a new one from your account.",
  "membre-du-lieu": "You can't book at your own place – you know that table already! Go and see what the neighbours are cooking instead.",
  "hors-ligne": "Nothing was sent. Check your connection, then send it again – your choices are waiting right here.",
  introuvable: "This place isn't on SOS Miam for now. Head back to Explore to find another one.",
};

export const PETIT_MOT_REFUSE_ANGLAIS: Traduction<typeof PETIT_MOT_REFUSE> = {
  emoji: "✋",
  titre: "Your note doesn't go down well here",
  texte: "It contains a word we don't allow. Rephrase it just above, or send your request without it.",
  sousLeChamp: "Mind rephrasing? Your note contains a word we don't allow.",
};

export const ACTIONS_REFUS_RESERVATION_ANGLAIS: Traduction<typeof ACTIONS_REFUS_RESERVATION> = {
  retourFiche: "Back to the place",
  voirExplorer: "Go to Explore",
  voirReservations: "See my bookings",
  confirmerEmail: "Confirm my email",
};

export const TEXTES_DEMANDE_ENVOYEE_ANGLAIS: Traduction<typeof TEXTES_DEMANDE_ENVOYEE> = {
  titre: "Request sent!",
  sousTitre: "The staff {deLieu} will reply right here in the app: their answer will land in My bookings.",
  titreAcceptee: "You're booked in!",
  sousTitreAcceptee: "The staff {deLieu} are expecting you. On the day, tap “I'm here” when you arrive: here, or in My bookings.",
  titreRefusee: "Not this time",
  sousTitreRefusee: "The staff {deLieu} have replied: the card explains why. Fancy another slot?",
  titreEndormie: "Request expired",
  sousTitreEndormie: "The staff {deLieu} didn't reply in time. Fancy another slot?",
  titreAnnulee: "Request cancelled",
  titreReservationAnnulee: "Booking cancelled",
  sousTitreAnnulee: "Fancy another date? Pick a new slot – the place might already be waiting for you.",
  etapesTitre: "What happens next?",
  etapes: [
    { emoji: "📬", texte: "The staff check their bookings and accept, or let you know if they're fully booked (it happens to the best of them)." },
    { emoji: "📍", texte: "On the day, tap “I'm here” in My bookings when you arrive: the staff will know it's you." },
    { emoji: "🛟", texte: "Your visit really counts: points, a stamp if there's a loyalty card, and your verified review." },
  ],
  planBRetenuTitre: "Your plan B came in handy",
  planBRetenu: "{premier} went in the meantime – we've kept {retenu} for you, your plan B.",
  voirReservations: "See my bookings",
  retourFiche: "Back to the place",
  autreCreneau: "Pick another slot",
  annonce: "Request sent. The place will reply in the app.",
  annonceAcceptee: "You're booked in! Your arrival code is waiting in My bookings.",
};

export const TEXTES_HORAIRES_SECOURS_ANGLAIS: Traduction<typeof TEXTES_HORAIRES_SECOURS> = {
  ou: "or {heures}",
  lu: "Backup times: {heures}",
  planB: "🔁 Your plan B: {retenu}, instead of {premier}",
  planBLu: "Your plan B came in handy: {retenu}, instead of {premier}",
};
