import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  ANNONCES_COMPTOIR_RESERVATIONS,
  CONFIRMATIONS_COMPTOIR_RESERVATIONS,
  TEXTES_COMPTOIR_RESERVATIONS,
  TEXTES_FERMER_JOUR,
  TEXTES_REMPLISSAGE,
} from "~/contenus/textes-comptoir-reservations";

export const TEXTES_COMPTOIR_RESERVATIONS_ANGLAIS: Traduction<typeof TEXTES_COMPTOIR_RESERVATIONS> = {
  changer: "Change",
  changerIndice: "Opens the booking settings",
  voirReglages: "No-booking days",
  voirReglagesIndice: "Opens the booking settings, where you can close a day",
  bandeauAuto: "Requests are accepted automatically as long as there's room. Something come up? You can still cancel a booking – the customer will be told.",
  aRepondreVideAuto: "Nothing to reply to – new tables are accepted automatically.",
  pourQuand: "for {quand}",
  premierChoix: "their 1st choice",
  planB: "their plan B",
  restePlaces: { un: "1 seat left", plusieurs: "{nombre} seats left" },
  complet: "fully booked for {personnes}",
  completCourt: "fully booked",
  horsReglages: "outside your services",
  jourFerme: "no-booking day",
  aucunQuiTient: "None of these times has room for {personnes}.",
  endormissement: "With no reply, the request expires at {heure}.",
  endormissementJour: "With no reply, the request expires {quand}.",
  accepter: "Accept at {heure}",
  accepterQuandMeme: "Accept at {heure} anyway",
  accepterLu: "Accept {nom} at {heure}, {personnes}",
  refuser: "Decline",
  refuserLu: "Decline {nom}'s request",
  autreHoraire: "Other time",
  autreHoraireLu: "See the other times {nom} suggested",
  replierHoraires: "Show less",
  replierHorairesLu: "Hide the times {nom} suggested",
  horairesProposes: "Suggested times",
  accepteeAuto: "⚡ Accepted automatically",
  accepteeAutoLu: "Accepted automatically",
  annuler: "Cancel booking",
  annulerLu: "Cancel {nom}'s booking",
  enCours: "Letting the customer know…",
};

export const CONFIRMATIONS_COMPTOIR_RESERVATIONS_ANGLAIS: Traduction<typeof CONFIRMATIONS_COMPTOIR_RESERVATIONS> = {
  depasser: {
    titre: "Accept anyway?",
    detailPlaces: "At {heure}, there's only {places} left for {personnes}: that's {depassement} too many. Still got room? You're the captain here!",
    detailComplet: "At {heure}, you're already fully booked: {nom}'s table adds {personnes}. Still got room? You're the captain here!",
    detailJourFerme: "You've closed bookings that day. Still got room for {nom} at {heure}? You're the captain here!",
    confirmer: "Accept anyway",
    rester: "Actually, no",
  },
  annuler: {
    titre: "Cancel {nom}'s booking?",
    detail: "We'll let {nom} know straight away, with the reason you choose. No free text – it's simpler for everyone.",
    confirmer: "Cancel booking",
  },
};

export const ANNONCES_COMPTOIR_RESERVATIONS_ANGLAIS: Traduction<typeof ANNONCES_COMPTOIR_RESERVATIONS> = {
  acceptee: "✅ {nom}'s table accepted at {heure} · code {code}",
  annulee: "{nom}'s booking cancelled – we've let them know",
  nouvelleDemande: "📬 New request from {nom}, {personnes}, {quand}",
  nouvelleAuto: "⚡ New table: {nom}, {personnes}, {quand}",
  nouvelles: "📬 {nombre} new tables to look at",
};

export const TEXTES_FERMER_JOUR_ANGLAIS: Traduction<typeof TEXTES_FERMER_JOUR> = {
  fermer: "🛑 No more bookings today",
  fermerIndice: "Today's slots disappear from the app – tables already booked stay",
  rouvrir: "Reopen today's bookings",
  rouvrirIndice: "Today's slots come back in the app",
  ferme: "Today's a no-booking day: the app isn't offering anything for today any more.",
  confirmationTitre: "No more bookings today?",
  confirmationDetail: "Today's slots disappear from the app. Tables already booked stay – nothing's cancelled.",
  confirmationConfirmer: "Close for today",
  confirmationRester: "Actually, no",
  annonceFerme: "🛑 No more bookings today – noted",
  annonceRouvert: "✅ Today's bookings are open again",
};

export const TEXTES_REMPLISSAGE_ANGLAIS: Traduction<typeof TEXTES_REMPLISSAGE> = {
  titre: "How today's filling up",
  service: "{acceptes} of {capacite} covers",
  serviceLu: "{service}, {acceptes} of {capacite} covers",
  creneauReste: { un: "1 seat left", plusieurs: "{nombre} seats left" },
  creneauComplet: "fully booked",
  creneauDemandes: { un: "+ 1 request ({personnes})", plusieurs: "+ {nombre} requests ({personnes})" },
  creneauLu: "{heure}, {acceptes} of {capacite} arrivals",
  deplier: "See it slot by slot",
  replier: "Show less",
  sansService: "No service today – nothing to fill, so enjoy it.",
  jourSansResa: "Today's a no-booking day: tables already booked stay.",
  finis: "Today's services are over. See you tomorrow, Brigade!",
  invitationTitre: "Want to see your seats here?",
  invitationTexte: "Set up your services and covers: you'll see what's left, slot by slot.",
  invitationBouton: "Set up my bookings",
};
