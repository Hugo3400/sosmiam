import type { ErreurServiceSociale } from "../../types/erreurs-service-sociales.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_SERVICES_SOCIAUX_ANGLAIS: Readonly<Record<ErreurServiceSociale, MessageService>> = {
  "pseudo-requis": {
    emoji: "🏷️",
    titre: "Pick your username first",
    texte: "It's what your friends type to find you. Profile › Edit my profile › My details, and off you go.",
  },
  "personne-inconnue": {
    emoji: "🕵️",
    titre: "Nobody by that name",
    texte: "This account doesn't exist, or no longer does. Check the username – a letter may have slipped away.",
  },
  "invitation-invalide": {
    emoji: "🔗",
    titre: "This link doesn't work any more",
    texte: "Your friend may have changed their link. Ask them to show you a fresh QR code.",
  },
  "bande-pleine": {
    emoji: "🚌",
    titre: "The crew is full",
    texte: "200 friends is the most a crew can hold. One of you needs to make a bit of room.",
  },
  "trop-de-demandes-en-attente": {
    emoji: "📨",
    titre: "Lots of requests on the way",
    texte: "Wait for a few friends to reply before sending more.",
  },
  "demandes-fermees": {
    emoji: "🔒",
    titre: "This person isn't taking requests",
    texte: "They've chosen not to be found by their username. To join their crew, ask them for their link or QR code!",
  },
  "demande-inconnue": {
    emoji: "🍃",
    titre: "This request has gone",
    texte: "It was cancelled, or it expired in the meantime.",
  },
  "pas-dans-la-bande": {
    emoji: "🤝",
    titre: "Only with your crew",
    texte: "To chat, invite or fill a list together, you need to be in the same crew.",
  },
  "profil-prive": {
    emoji: "🔒",
    titre: "Just for their crew",
    texte: "This person keeps this for their friends. The rest of their profile is just above.",
  },
  "trop-d-abonnements": {
    emoji: "🧲",
    titre: "You already follow loads of people",
    texte: "2,000 is the most you can follow. A little tidy-up does you good too.",
  },
  "trop-de-blocages": {
    emoji: "🧱",
    titre: "That's quite a list",
    texte: "You've already blocked 1,000 people. Write to us if someone is really bothering you.",
  },
  "conversation-inconnue": {
    emoji: "💨",
    titre: "Chat not found",
    texte: "It's been deleted, or you're no longer in it.",
  },
  "conversation-fermee": {
    emoji: "🔇",
    titre: "Read-only chat",
    texte: "You're no longer in the same crew – you can read it back, but not write.",
  },
  "groupe-plein": {
    emoji: "🎪",
    titre: "The group is full",
    texte: "20 people, pending invitations included, is the most a group can hold. That's already quite a table!",
  },
  "reserve-aux-admins": {
    emoji: "🎩",
    titre: "Over to the admins",
    texte: "Only the group's admins can invite, remove or rename.",
  },
  "reserve-a-l-auteur": {
    emoji: "✍️",
    titre: "Hands off, it's their creation",
    texte: "Only its author can do that (and its co-authors, to fill a list).",
  },
  "reserve-au-gerant": {
    emoji: "🧑‍🍳",
    titre: "For the venue's manager only",
    texte: "Only the venue's manager can reply on its behalf or hide a comment under its post.",
  },
  "reserve-a-l-organisateur": {
    emoji: "🧑‍✈️",
    titre: "The organiser decides",
    texte: "Only the get-together's organiser can do that.",
  },
  "message-inconnu": {
    emoji: "💨",
    titre: "Message not found",
    texte: "It's been deleted in the meantime.",
  },
  "media-expire": {
    emoji: "⏳",
    titre: "This file has expired",
    texte: "Photos and voice notes are deleted from our server 90 days after they're sent.",
  },
  "media-invalide": {
    emoji: "🖼️",
    titre: "This file won't go through",
    texte: "Photos up to 4,096 pixels per side, or voice notes up to one minute.",
  },
  "media-trop-lourd": {
    emoji: "🐘",
    titre: "File too heavy",
    texte: "5 MB for a photo, 2 MB for a voice note. Try something shorter or lighter.",
  },
  "format-refuse": {
    emoji: "🧩",
    titre: "Unknown format",
    texte: "We take photos and voice notes sent from the app.",
  },
  "trop-de-medias": {
    emoji: "📸",
    titre: "Photo break!",
    texte: "50 photos and voice notes a day is the limit. More tomorrow!",
  },
  "sortie-inconnue": {
    emoji: "🎈",
    titre: "This get-together has gone",
    texte: "It was cancelled, or you're no longer invited.",
  },
  "sortie-pleine": {
    emoji: "🪑",
    titre: "Not a chair left",
    texte: "15 people per get-together, organiser included.",
  },
  "sortie-passee": {
    emoji: "🕰️",
    titre: "That's already happened",
    texte: "This get-together has taken place – nobody can be invited or join any more.",
  },
  "vote-termine": {
    emoji: "🗳️",
    titre: "The votes are in",
    texte: "Voting's over – see you at the chosen place!",
  },
  "max-propositions": {
    emoji: "📋",
    titre: "The list of places is full",
    texte: "8 suggested places is the limit. Vote among them!",
  },
  "trop-de-sorties": {
    emoji: "🗓️",
    titre: "Your diary's overflowing",
    texte: "20 upcoming get-togethers is the limit. Enjoy those first!",
  },
  "liste-inconnue": {
    emoji: "📭",
    titre: "List not found",
    texte: "It's been deleted, or you can no longer see it.",
  },
  "trop-de-listes": {
    emoji: "📚",
    titre: "That's a lot of lists",
    texte: "50 lists is the limit. Merge or delete the ones gathering dust.",
  },
  "liste-pleine": {
    emoji: "🧺",
    titre: "List full to bursting",
    texte: "100 places per list is the limit. Why not start another one?",
  },
  "trop-de-co-auteurs": {
    emoji: "👥",
    titre: "Enough cooks in the kitchen",
    texte: "10 co-authors per list is the limit.",
  },
  "invitation-inconnue": {
    emoji: "🍃",
    titre: "This invitation has gone",
    texte: "It was withdrawn, or it expired in the meantime.",
  },
  "commentaire-inconnu": {
    emoji: "💨",
    titre: "Comment not found",
    texte: "It's been deleted in the meantime.",
  },
  "contenu-inconnu": {
    emoji: "💨",
    titre: "Nothing left to report",
    texte: "This content has disappeared in the meantime.",
  },
  "signalement-invalide": {
    emoji: "📝",
    titre: "A detail's missing",
    texte: "Pick a reason, and explain in your own words if it's “Something else” (at least 10 characters).",
  },
  "chiffrement-indisponible": {
    emoji: "🔐",
    titre: "The vault is locked",
    texte: "Our vault is locked for a little while. Try again in a moment – nothing's lost.",
  },
  "geree-par-la-sortie": {
    emoji: "🎉",
    titre: "It's handled in the get-together",
    texte: "To invite, remove or leave, go through the get-together itself.",
  },
  "trop-de-masques": {
    emoji: "🙈",
    titre: "Your view is already nice and tidy",
    texte: "2,000 hidden items is the limit. Bring a few back before hiding more.",
  },
  "deja-examine": {
    emoji: "🔎",
    titre: "Already reviewed",
    texte: "Our moderation team has already looked at this comment and left it up.",
  },
  "stockage-plein": {
    emoji: "📦",
    titre: "Our cupboards are overflowing",
    texte: "We're making a bit of room on the server. Your photo or voice note can go out in a moment.",
  },
  "decision-inconnue": {
    emoji: "🍃",
    titre: "Decision not found",
    texte: "It hasn't been made yet, or it doesn't concern you.",
  },
  "deja-contestee": {
    emoji: "📮",
    titre: "Already appealed",
    texte: "We've received your appeal – we're looking at it again and we'll keep you posted.",
  },
  "contestation-hors-delai": {
    emoji: "🕰️",
    titre: "Too late to appeal",
    texte: "A decision can be appealed for 6 months. Write to us if it's really important.",
  },
  "notification-inconnue": {
    emoji: "🍃",
    titre: "Already gone",
    texte: "This notification has already been cleared, maybe from your other phone.",
  },
  "trop-tard": {
    emoji: "⏱️",
    titre: "Too late to edit",
    texte: "A message can be edited within 15 minutes of sending. Nothing's stopping you from writing a new one!",
  },
  "non-modifiable": {
    emoji: "✋",
    titre: "Can't be edited",
    texte: "Only your text messages can be edited – a photo, a place or a poll stays as it is.",
  },
  "pas-l-auteur": {
    emoji: "🙅",
    titre: "That's not your message",
    texte: "Only the person who wrote it can edit it.",
  },
  "reponse-introuvable": {
    emoji: "💨",
    titre: "Message not found",
    texte: "The message you're quoting has disappeared in the meantime.",
  },
  "trop-d-epinglees": {
    emoji: "📌",
    titre: "Already 3 pinned",
    texte: "Unpin a chat to put a new one at the top.",
  },
  "album-plein": {
    emoji: "🖼️",
    titre: "The album is full",
    texte: "10 photos at once at most – send the rest in another message!",
  },
  "onde-invalide": {
    emoji: "🎙️",
    titre: "Damaged voice note",
    texte: "It couldn't be sent. Record it again – it only takes a minute.",
  },
  "photo-inconnue": {
    emoji: "🖼️",
    titre: "No photo yet",
    texte: "This group doesn't have its photo yet.",
  },
  "reserve-aux-groupes": {
    emoji: "👥",
    titre: "Only in a group",
    texte: "“Where shall we eat?” polls are started in a group of friends.",
  },
  "sondage-clos": {
    emoji: "🗳️",
    titre: "Voting's over",
    texte: "This poll has ended – go and see who won!",
  },
  "gif-indisponible": {
    emoji: "🎞️",
    titre: "The GIFs are having a nap",
    texte: "We can't reach them right now. Try again in a moment.",
  },
  "gif-inconnu": {
    emoji: "🎞️",
    titre: "GIF not found",
    texte: "This GIF no longer exists. Pick another one!",
  },
  "gif-refuse": {
    emoji: "🙈",
    titre: "GIF not allowed",
    texte: "That one doesn't get past our filters. Pick another one!",
  },
};
