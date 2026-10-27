import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_LIMITATION } from "../limitation-compte.ts";

export const TEXTES_LIMITATION_ANGLAIS: Traduction<typeof TEXTES_LIMITATION> = {
  titre: "Your account is restricted",
  titreAVenir: "Your account is going to be restricted",
  intro: "The SOS Miam team has restricted your account {fin}. Here's why, what it changes, and how to tell us if you disagree.",
  introAVenir: "The SOS Miam team is going to restrict your account from {debut}, {fin}. Here's why and what it will change.",
  motif: "The rule involved",
  motifInconnu: "One of the community rules",
  pourquoi: "What the team says",
  coupeTitre: "What has to wait until it ends",
  coupe:
    "Anything others would see: messages (photos and voice notes included) and reactions, groups (creating, renaming, inviting, changing admins), comments (writing, editing), reviews (verified or not), get-togethers (creating, inviting, suggesting a place), lists (creating, editing, adding a place, inviting someone to add to one), places sent to your friends, joining someone's friends or asking to, following someone, suggestions on a place's page, a new first name, username or avatar, and the note on a booking request. In Pro mode, posting for your venue: its listing, its menu, tonight's SOS, the message of the moment (showing it or clearing it), events (posting, editing) and replies to reviews; creating, restarting or editing its loyalty card; ending the SOS or cancelling a colleague's event; inviting people to your team or joining one. In the Miamis section: organising a get-together or asking to join one, showing up in “Who's around?”, waving, suggesting an idea or commenting on one.",
  resteTitre: "What works as usual",
  reste:
    "Reading everything, getting your visits confirmed, booking a table (without a note), Miam Safe, voting in a get-together, liking a comment, accepting or declining an invitation (except one to join a team) or a request, following a list, reporting, blocking, hiding, leaving, removing someone from your get-together or your group, deleting your content, your settings, anything only the team reads (suggesting a place, asking to manage a venue, your ambassador missions…), exporting your data and deleting your account. In Pro mode: your venue's counter (confirming visits, replying to bookings), ending your own SOS, cancelling your own events and switching off the loyalty card as it is. In the Miamis section: hiding from “Who's around?”, leaving a get-together, accepting or declining people who want to join yours, voting for an idea, liking a comment, and your gender.",
  contesterTitre: "Disagree?",
  contester:
    "Tell us why. You can do this once, while the restriction lasts. Someone on the team other than the person who decided reviews everything, and replies in the app and by email.",
  aideContestation: "10 to 1,000 characters. What happened, and what we might have missed – just say it simply.",
  libelleContestation: "Why you disagree",
  boutonContester: "Send my appeal",
  contestationAVenir: "You'll be able to appeal as soon as it starts.",
  contestationEnvoyee: "Your appeal was sent on {date}:",
  contestationEnAttente: "Someone else on the team is reviewing it. Their reply will come in the app and by email.",
  contestationMaintenue: "It was reviewed on {date} by someone else on the team, and the restriction stays in place.",
  envoiReussi: "Sent! Someone else on the team will review your appeal.",
  dejaConteste: "You've already appealed this restriction. There's only one appeal, and yours has arrived.",
  plusDeLimitation: "Your restriction is over or has been lifted, so there's nothing left to appeal. Welcome back to the Miamis!",
  texteInvalide: "Write between 10 and 1,000 characters.",
  regle: (regle: string) => `: “${regle}”.`,
};
