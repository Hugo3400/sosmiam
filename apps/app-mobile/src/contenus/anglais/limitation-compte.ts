import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { BULLE_EN_PAUSE, CARTE_REFUS_LIMITATION, REFUS_LIMITATION, TEXTES_LIMITATION } from "~/contenus/limitation-compte";

export const TEXTES_LIMITATION_ANGLAIS: Traduction<typeof TEXTES_LIMITATION> = {
  titre: "Your account is restricted",
  titreAVenir: "Your account is going to be restricted",
  titreFinie: "Your account was restricted",
  intro: "The SOS Miam team has restricted your account {fin}. Here's why, what it changes, and how to tell us you disagree.",
  introAVenir: "The SOS Miam team is going to restrict your account from {debut}, {fin}. Here's why and what it will change.",
  introFinie: "It's over or lifted, and everything's back to normal. Welcome back to the Miamis!",
  regle: "The rule in question",
  regleInconnue: "One of the community rules (our Terms of Use)",
  explication: "What the SOS Miam team says",
  coupeTitre: "What has to wait until it ends",
  coupe:
    "Everything other people would see: messages (photos and voice notes included) and reactions, groups (creating, renaming, inviting, changing the admins), comments (writing, editing), reviews (verified or not), get-togethers (creating, inviting, suggesting a place), lists (creating, editing, adding a place, inviting someone to add to them), places sent to your friends, joining someone's friends or asking to be added, following someone, suggestions on a place's page, a new first name, username or avatar, and the note on a booking request. In Pro mode, publishing for your venue: its listing, its menu, tonight's SOS, the message of the moment (showing it or clearing it), events (publishing, editing) and replies to reviews; creating, turning back on or editing its loyalty card; ending a colleague's SOS or cancelling a colleague's event; inviting someone to your team or joining one. Among the Miamis: organising a get-together or asking to join one, showing up in “Who's around?”, waving, suggesting an idea or commenting on one.",
  resteTitre: "What works as usual",
  reste:
    "Reading everything, getting your visits confirmed, booking a table (without a note), Miam Safe, voting in a get-together, liking a comment, accepting or declining an invitation (except to join a team) or a request, following a list, reporting, blocking, hiding, leaving, removing someone from your get-together or your group, deleting your content, your settings, what only the SOS Miam team reads (suggesting a place, asking to manage a venue, your ambassador missions…), exporting your data and deleting your account. In Pro mode: your venue's counter (confirming visits, replying to bookings), ending your own SOS, cancelling your own events and turning off the loyalty card as it is. Among the Miamis: hiding from “Who's around?”, leaving a get-together, accepting or declining requests to join yours, voting for an idea, liking a comment, and your gender.",
  contesterTitre: "Disagree?",
  contester: "Tell us why: once only, while the restriction lasts. Someone else on the SOS Miam team, not the person who decided, will read everything again.",
  contestationAVenir: "You'll be able to appeal as soon as it starts.",
  contestationEnvoyee: "Your appeal was sent on {date}:",
  contestationEnvoyeeSansDate: "Your appeal has been sent:",
  contestationEnAttente: "Someone else on the SOS Miam team is reading it. Their answer will appear here.",
  contestationMaintenue: "Someone else on the SOS Miam team read it on {date}: the restriction stays in place.",
  contestationRelue: "Someone else on the SOS Miam team read it on {date}.",
  annonce: "Your account is restricted {fin}: some actions are on hold.",
};

export const REFUS_LIMITATION_ANGLAIS: Traduction<typeof REFUS_LIMITATION> = {
  commentaire: "Your account is restricted: comments are on hold for now.",
  message: "Your account is restricted: messages are on hold for now.",
  bulle: "Not sent: your account is restricted.",
  groupe: "Your account is restricted: creating a group will have to wait until the restriction ends.",
  lieuEnvoye: "Your account is restricted: sending a place to your friends will have to wait until the restriction ends.",
  liste: "Your account is restricted: creating or editing a list will have to wait until the restriction ends.",
  lieuListe: "Your account is restricted: adding a place to a list will have to wait until the restriction ends.",
  coAuteur: "Your account is restricted: inviting someone to add to your list will have to wait until the restriction ends.",
  sortie: "Your account is restricted: get-togethers (creating, inviting, suggesting a place) are on hold for now.",
  bande: "Your account is restricted: joining someone's friends or asking to be added will have to wait until the restriction ends.",
  suivre: "Your account is restricted: following someone will have to wait until the restriction ends.",
  suggestion: "Your account is restricted: suggestions on a place's page are on hold for now.",
  ficheLieu: "Your account is restricted: your venue's listing and menu will have to wait until the restriction ends.",
  fidelite: "Your account is restricted: creating, turning back on or editing the loyalty card will have to wait until the restriction ends. You can still turn it off as it is.",
  sosDuSoir: "Your account is restricted: sending out tonight's SOS will have to wait until the restriction ends.",
  arreterSos: "Your account is restricted: ending a colleague's SOS will have to wait until the restriction ends. You can still end your own.",
  messageMoment: "Your account is restricted: showing a message of the moment will have to wait until the restriction ends.",
  effacerMessage: "Your account is restricted: clearing the message of the moment will have to wait until the restriction ends.",
  evenement: "Your account is restricted: publishing or editing an event will have to wait until the restriction ends.",
  annulerEvenement: "Your account is restricted: cancelling a colleague's event will have to wait until the restriction ends. You can still cancel your own.",
  avis: "Your account is restricted: reviews (verified or not) are on hold for now.",
  reponseAvis: "Your account is restricted: replying to reviews will have to wait until the restriction ends.",
  petitMot: "Your account is restricted: the note for the venue will have to wait until the restriction ends. Send your request without a note and it'll go through as usual.",
};

export const BULLE_EN_PAUSE_ANGLAIS: Traduction<typeof BULLE_EN_PAUSE> = {
  voirPourquoi: "See why",
  indiceVoirPourquoi: "Opens the moderation decisions",
  retirer: "Remove",
  retirerLu: "Remove this message",
  indiceRetirer: "It was never sent, so it'll just disappear from your phone",
  retire: "Message removed.",
};

export const CARTE_REFUS_LIMITATION_ANGLAIS: Traduction<typeof CARTE_REFUS_LIMITATION> = {
  emoji: "⏸️",
  titre: "Account restricted for now",
  titreAjout: "Not this time",
};
