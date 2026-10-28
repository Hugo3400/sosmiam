import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ANNULATION_RESERVATION, ARRIVEE_RESERVATION, CARTE_RESERVATION, EXPLICATIONS_RESERVATION } from "~/contenus/textes-reservations-client";

type Place = "table" | "place";

const JE_SUIS_LA = "“I'm here”";

const nommerPlace = (place: Place) => (place === "place" ? "spot" : "table");
const ecrireHeures = (heures: number) => `${heures} hour${heures === 1 ? "" : "s"}`;

export const EXPLICATIONS_RESERVATION_ANGLAIS: Traduction<typeof EXPLICATIONS_RESERVATION> = {
  consolations: {
    complet: "Don't panic – there are plenty of other slots (and plenty of other gems).",
    ferme: "Don't panic – there are plenty of other slots (and plenty of other gems).",
    "groupe-trop-grand": "Give the place a call to talk it over, or try another gem.",
    autre: "Don't panic – there are plenty of other gems to discover.",
  },
  annuleeParLieu: (motif: string) => `The place had to cancel: ${motif}. Sorry for the hiccup – it's not your fault.`,
  retireeAvantReponse: (place: Place) => `You withdrew it before they replied, so the place won't look for a ${nommerPlace(place)} for nothing. No worries!`,
  annuleeTardive: (heures: number) => `Cancelled less than ${ecrireHeures(heures)} before – the place will have seen it. No big deal if it doesn't happen often.`,
  annuleeATemps: (place: Place) => `Cancelled in time – your ${nommerPlace(place)} has gone to a fellow Miami. Thanks from the place!`,
  nonPointeeAvecPresence: `You tapped ${JE_SUIS_LA}, but the place didn't note your visit in time, so this visit can't count. Nothing counts against you.`,
  nonPointee: "The slot passed without the place noting your visit, so this visit can't count. Nothing counts against you, promise.",
  honoreePresencePossible: `The place has noted your arrival! Tap ${JE_SUIS_LA} so your visit counts.`,
  honoreeAvecPresence: "The place has noted your visit, and it counts in “My visits”. Come back whenever you like!",
  honoreeSansPresence: `The place noted your visit, but without ${JE_SUIS_LA} on the spot, it couldn't count. Next time, tap it when you arrive!`,
  demandeePlusieurs: "The place picks whichever of your times suits them and replies here. With no reply in time, the request quietly expires – nothing counts against you.",
  demandee: "The place replies here, before your slot. With no reply in time, the request quietly expires – nothing counts against you.",
  refusee: (motif: string, consolation: string) => `The place replied: ${motif}. ${consolation}`,
  expiree: "The place didn't reply in time, so the request expired. Nothing counts against you.",
  absent: (place: Place) => `The place marked a no-show. Things come up! Next time, cancel in the app – your ${nommerPlace(place)} will make a fellow Miami's day.`,
};

export const ANNULATION_RESERVATION_ANGLAIS: Traduction<typeof ANNULATION_RESERVATION> = {
  demande: {
    titre: "Cancel your request?",
    detail: (resume: string, place: Place) => `${resume} The place hasn't replied yet, so they won't look for a ${nommerPlace(place)} for nothing.`,
    libelleConfirmer: "Cancel the request",
    libelleRester: "Keep my request",
    annonce: "Request cancelled.",
  },
  reservation: {
    titre: "Cancel your booking?",
    detailTardive: (resume: string, heures: number) =>
      `${resume} It's less than ${ecrireHeures(heures)} away, so the place will see this last-minute cancellation. No big deal if it doesn't happen often, promise.`,
    detail: (resume: string, place: Place) => `${resume} If you cancel now, your ${nommerPlace(place)} goes to a fellow Miami.`,
    libelleConfirmer: "Cancel the booking",
    libelleRester: (place: Place) => `Keep my ${nommerPlace(place)}`,
    annonce: "Booking cancelled.",
  },
};

export const ARRIVEE_RESERVATION_ANGLAIS: Traduction<typeof ARRIVEE_RESERVATION> = {
  surPlace: "📍 Noted, you're here!",
  legendeCode: "Give this code to the staff",
  visiteComptera: (souhait: string) => `Your visit will count as soon as the staff tap “Arrived”. ${souhait}`,
  souhaitRepas: "Bon appétit!",
  souhaitSortie: "Have fun!",
  presencePossible: `On your way? Once you're there, tap ${JE_SUIS_LA} – that's what makes your visit count.`,
  bouton: "📍 I'm here",
  boutonLu: (chezLieu: string) => `I'm here ${chezLieu}`,
  boutonIndice: (chezLieu: string) => `Confirms you're really ${chezLieu}, using your location`,
  position: "Your location is only used to check you're there – it's never kept.",
  attenteCreneau: (heures: number) => `The place is expecting you! ${JE_SUIS_LA} lights up ${ecrireHeures(heures)} before your slot – tap it when you're there so your visit counts.`,
  code: "Your arrival code",
  codeLu: (code: string) => `Your arrival code: ${code}`,
};

export const CARTE_RESERVATION_ANGLAIS: Traduction<typeof CARTE_RESERVATION> = {
  petitMot: "Your note",
  voirLieu: "See the place",
  voirLieuLu: (_deLieu: string, nom: string) => `See ${nom}'s page`,
  voirLieuIndice: "Opens the place's page",
  annulerDemande: "Cancel request",
  annulerReservation: "Cancel the booking",
  annuler: "Cancel",
  annulerLu: (libelle: string, chezLieu: string) => `${libelle} ${chezLieu}`,
  annulerIndice: "Asks you to confirm before cancelling",
  ouEtVille: (nom: string, ville: string) => `${nom}, in ${ville}`,
  plage: (premier: string, dernier: string) => `· ${premier}–${dernier}`,
  plageLu: (titre: string, premier: string, dernier: string) => `${titre}, from ${premier} to ${dernier}`,
  videTitre: "No tables on the horizon yet",
  videTexte: "Your foodie diary is emptier than the fridge on a Sunday night. Spot a gem that takes bookings in the app – your request and their reply will be waiting for you here.",
  videBouton: "Find a gem",
  videIndice: "Opens the Explore tab",
  aVenir: "Upcoming",
  passees: "Past",
  sectionLu: (titre: string, nombre: number) => `${titre}, ${nombre} booking${nombre === 1 ? "" : "s"}`,
  scanLu: (titre: string, nombre: number) => `${titre}, ${nombre} upcoming`,
  entreeAVenir: (nombre: number) => `${nombre} upcoming`,
  entreeEnAttente: (aVenir: string, nombre: number) => `${aVenir} · ${nombre} waiting for a reply`,
  jourPlace: (index: number, total: number) => `, ${index} of ${total}`,
  ouvrirReglages: "Open Settings",
  reessayer: "Try again",
  toi: "You",
};
