import type { ErreurService } from "../../types/erreurs-service.ts";
import type { MessageService } from "../messages-services.ts";
import { MESSAGES_CARRIERE_ANGLAIS } from "./messages-carriere.ts";
import { MESSAGES_CONNEXION_QR_ANGLAIS } from "./messages-connexion-qr.ts";
import { MESSAGES_RESERVATIONS_ANGLAIS } from "./messages-reservations.ts";
import { MESSAGES_ACTUS_ANGLAIS } from "./messages-actus.ts";
import { MESSAGES_IMAGES_LIEU_ANGLAIS } from "./messages-images-lieu.ts";
import { MESSAGES_SECURITE_ANGLAIS } from "./messages-securite.ts";
import { MESSAGES_SERVICES_COMMUNAUTE_ANGLAIS } from "./messages-services-communaute.ts";
import { MESSAGES_SERVICES_SOCIAUX_ANGLAIS } from "./messages-services-sociaux.ts";

export const MESSAGES_SERVICE_ANGLAIS: Readonly<Record<ErreurService, MessageService>> = {
  "connexion-requise": {
    emoji: "🔑",
    titre: "You'll need an account",
    texte: "Create your account so your visits count – points, stamps and verified reviews.",
  },
  "service-indisponible": {
    emoji: "🛠️",
    titre: "Coming with accounts",
    texte: "Visit confirmation switches on as soon as SOS Miam accounts open. Just a little longer!",
  },
  "erreur-serveur": {
    emoji: "🧯",
    titre: "A little hiccup on our side",
    texte: "Our server tripped up – it's not you. Try again in a moment, and if it keeps happening, write to us.",
  },
  "champ-invalide": {
    emoji: "✏️",
    titre: "Something's not quite right",
    texte: "Have a look at the highlighted field, fix it, and you're off again.",
  },
  "identifiants": {
    emoji: "🔑",
    titre: "Incorrect email or password",
    texte: "Check both. Signed up with Apple or Google? Use their button, or set a password via “Forgotten your password?”",
  },
  "email-deja-utilise": {
    emoji: "📮",
    titre: "This email already has an account",
    texte: "Log in with it, or use “Forgotten your password?” if you can't remember it.",
  },
  "age-minimum": {
    emoji: "🎂",
    titre: "Just a little longer",
    texte: "In France, SOS Miam is for over-18s. We'll keep a table warm for you till then!",
  },
  "pseudo-pris": {
    emoji: "🏷️",
    titre: "That username's taken",
    texte: "Someone had the same brilliant idea. Try a variation, with your neighbourhood or your favourite dish.",
  },
  "mot-de-passe-incorrect": {
    emoji: "🔒",
    titre: "Incorrect password",
    texte: "That's not the right one. Try again, or use “Forgotten your password?”",
  },
  "jeton-externe-invalide": {
    emoji: "🪪",
    titre: "The login didn't go through",
    texte: "Apple or Google didn't confirm it's really you. Try again in a moment.",
  },
  "compte-deja-rattache": {
    emoji: "🔗",
    titre: "Already linked to another account",
    texte: "This Apple or Google account is already linked to another SOS Miam account. Log in with that one.",
  },
  "confirmation-incorrecte": {
    emoji: "🛑",
    titre: "Confirmation declined",
    texte: "To delete your account, log in again with the same Apple or Google account as usual.",
  },
  "deja-relie": {
    emoji: "🔗",
    titre: "There's already a key here",
    texte: "Your SOS Miam account already has another account of this kind linked. Unlink it first, then link the new one.",
  },
  "identite-deja-reliee": {
    emoji: "🔗",
    titre: "Already linked to another account",
    texte: "This account is already linked to another SOS Miam account. We never merge two accounts – unlink it from the other account (or delete that one), then come back and link it here.",
  },
  "derniere-connexion": {
    emoji: "🚪",
    titre: "It's your only key",
    texte: "Without it, you'd be locked out! Add a password or link another account first.",
  },
  "apple-indisponible": {
    emoji: "🍎",
    titre: "Apple isn't answering",
    texte: "Logging in with Apple isn't possible right now. Try again a bit later.",
  },
  "google-indisponible": {
    emoji: "🔍",
    titre: "Google isn't answering",
    texte: "Logging in with Google isn't possible right now. Try again a bit later.",
  },
  "verification-indisponible": {
    emoji: "⏳",
    titre: "Verification on pause",
    texte: "We can't check your login right now. Try again in 30 seconds.",
  },
  "email-manquant": {
    emoji: "📭",
    titre: "We need your email",
    texte: "Allow your email to be shared (even a hidden one) when you log in, then try again.",
  },
  "profil-a-completer": {
    emoji: "👋",
    titre: "Just a few more details",
    texte: "Your first name, date of birth and city, and you're all set.",
  },
  "reserve-aux-majeurs": {
    emoji: "🔞",
    titre: "This is for over-18s",
    texte: "This corner of SOS Miam is for people aged 18 and over. Got your date of birth wrong? Write to us at bonjour@sosmiam.fr and we'll sort it out together.",
  },
  "compte-mineur": {
    emoji: "🧑‍🍳",
    titre: "Not before 18",
    texte: "This person isn't 18 yet, so they can't join a venue's team on SOS Miam.",
  },
  "evenement-invalide": {
    emoji: "📝",
    titre: "A detail to check",
    texte: "One field of your event doesn't work – the highlighted one. No swearing, no open bar, and 3 months ahead at most.",
  },
  "trop-d-evenements": {
    emoji: "🗓️",
    titre: "Your diary's overflowing",
    texte: "10 upcoming events per venue is the limit. Cancel one or wait for the next one to pass.",
  },
  "evenement-passe": {
    emoji: "🎬",
    titre: "It's already over",
    texte: "This event has passed, so it can no longer be edited or cancelled. The next one will be even better!",
  },
  "evenement-inconnu": {
    emoji: "🎈",
    titre: "This event has gone",
    texte: "It was cancelled or removed in the meantime. Have a look at the other events nearby!",
  },
  "avis-ferme": {
    emoji: "⌛",
    titre: "Too late for this review",
    texte: "Reviews can be left within 14 days of your visit. Pop back and see them – your next visit opens a brand-new one!",
  },
  "avis-visite-requise": {
    emoji: "🧾",
    titre: "Here, reviews are earned at the table",
    texte: "This place is verified – get your visit confirmed when you pay, and your review opens an hour later.",
  },
  "avis-recent": {
    emoji: "📆",
    titre: "You've already reviewed this place",
    texte: "One review per place every 30 days – the next one will be possible from {date}. Your taste buds have a good memory!",
  },
  "reponse-deja-donnee": {
    emoji: "💬",
    titre: "You've already replied",
    texte: "One reply per review, and yours has already gone through. The SOS Miam team checks it, like all the others.",
  },
  "hors-ligne": {
    emoji: "📶",
    titre: "No signal here",
    texte: "Nothing was sent. Move closer to the door or the venue's Wi-Fi, then try again – nothing's lost.",
  },
  "trop-de-demandes": {
    emoji: "🐢",
    titre: "Easy does it!",
    texte: "Lots of attempts in one go – try again in a few minutes.",
  },
  "compte-limite": {
    emoji: "⏸️",
    titre: "Account restricted until {date}",
    texte: "Some actions are paused for now. We explain why in Settings › Moderation decisions. If it's a mistake, appeal and a human will review it.",
  },
  "aucune-limitation": {
    emoji: "🌤️",
    titre: "Nothing to appeal",
    texte: "Your account isn't restricted (or no longer is), so everything works normally.",
  },
  "deja-conteste": {
    emoji: "📨",
    titre: "Appeal already sent",
    texte: "We've got your appeal – another member of the team is reviewing it, and you'll get their answer. Only one per restriction.",
  },
  "validations-en-pause": {
    emoji: "⏸️",
    titre: "Confirmations paused until {date}",
    texte: "We've written to you to explain why. If it's a mistake, reply to us and a human will review it.",
  },
  introuvable: {
    emoji: "🔍",
    titre: "Not found",
    texte: "It no longer exists, or it never did. Start again from the beginning.",
  },
  "transition-interdite": {
    emoji: "🔁",
    titre: "It's already sorted",
    texte: "Someone was quicker – the screen is updating.",
  },
  "delai-depasse": {
    emoji: "⌛",
    titre: "Too late for that",
    texte: "The deadline has passed. Never mind – next time!",
  },
  "role-requis": {
    emoji: "🚪",
    titre: "No access here",
    texte: "This area is for the venue's team or approved ambassadors.",
  },
  "lieu-sans-validation": {
    emoji: "🌱",
    titre: "{lieu} doesn't confirm visits yet",
    texte: "It's coming soon. In the meantime, a rescue always makes their day.",
  },
  "membre-du-lieu": {
    emoji: "🧑‍🍳",
    titre: "You're on the team here",
    texte: "Your visits to your own place don't count, or it would be too easy. Go and see what the neighbours are cooking!",
  },
  "sos-deja-lance": {
    emoji: "🆘",
    titre: "One SOS a day",
    texte: "Tonight's SOS has already been sent out (even if it's been stopped). Same again tomorrow, promise.",
  },
  "email-non-verifie": {
    emoji: "📬",
    titre: "Confirm your email first",
    texte: "To confirm a visit, we need a confirmed email. Tap the link we sent you, or ask for it again from your account.",
  },
  "position-refusee": {
    emoji: "📍",
    titre: "Without your location, we can't check you're there",
    texte: "… and your visit wouldn't count. No pressure – the meal's just as good without points.",
  },
  "position-bloquee": {
    emoji: "📍",
    titre: "Your location is blocked for SOS Miam",
    texte: "You can allow it in your phone's Settings app, just long enough to confirm.",
  },
  "position-coupee": {
    emoji: "📡",
    titre: "Location services are off",
    texte: "Turn them back on in your phone's Settings app, then try again.",
  },
  "position-introuvable": {
    emoji: "🛰️",
    titre: "Your phone doesn't know where it is",
    texte: "Move closer to a window or step outside for a second, then try again.",
  },
  "position-approximative": {
    emoji: "🎯",
    titre: "Your location is set to approximate",
    texte: "Turn on Precise Location for SOS Miam in your phone's Settings app, just long enough to confirm. You can turn it off afterwards.",
  },
  "position-imprecise": {
    emoji: "🌫️",
    titre: "Your phone isn't sure",
    texte: "It places you within {precision}, which is too vague to confirm. Move closer to a window, then try again.",
  },
  "position-perimee": {
    emoji: "⏱️",
    titre: "Your location is a bit out of date",
    texte: "We're reading a fresh one – try again.",
  },
  "position-simulee": {
    emoji: "🕹️",
    titre: "Your location seems to be faked by an app",
    texte: "Turn it off to confirm your visit.",
  },
  "hors-zone": {
    emoji: "🗺️",
    titre: "You seem a bit far away",
    texte: "We place you about {distance} from {lieu}. To confirm, you need to be there.",
  },
  "qr-illisible": {
    emoji: "🤔",
    titre: "This QR code isn't one of ours",
    texte: "Nice one all the same. Look for the one the staff show you, or ask for the bill in the app.",
  },
  "qr-vitrine": {
    emoji: "🪧",
    titre: "That's the window QR code",
    texte: "It opens the page for {lieu}. Your visit is confirmed when you pay – the staff show you a QR code that changes.",
  },
  "qr-invitation": {
    emoji: "👋",
    titre: "That's a friend's QR code, not the counter's",
    texte: "To add a friend, go to the Community tab.",
  },
  "qr-expire": {
    emoji: "⏳",
    titre: "This QR code has already changed",
    texte: "It changes every 30 seconds to keep the clever clogs at bay. Ask the staff to show it to you again.",
  },
  "qr-invalide": {
    emoji: "🤔",
    titre: "This QR code doesn't look valid",
    texte: "Ask the staff to show it to you again, or ask for the bill in the app.",
  },
  "qr-epuise": {
    emoji: "🎟️",
    titre: "This QR code has already been used by everyone",
    texte: "The staff can show you another one.",
  },
  "qr-demo": {
    emoji: "🧪",
    titre: "That's a demo QR code",
    texte: "It only works in the demo, not for real.",
  },
  "deja-validee": {
    emoji: "✅",
    titre: "Already confirmed",
    texte: "You're all set!",
  },
  "demande-en-cours": {
    emoji: "🧾",
    titre: "One bill at a time",
    texte: "You've already got one waiting at {lieu}. Cancel it first if you've changed tables.",
  },
  "code-faux": {
    emoji: "🔢",
    titre: "That's not the right code",
    texte: "Ask the person to show their screen again – 4 digits, next to their first name.",
  },
  "message-refuse": {
    emoji: "✋",
    titre: "Shall we rephrase?",
    texte: "Your note contains a word we don't let through.",
  },
  "pas-de-recompense": {
    emoji: "🎁",
    titre: "No reward yet",
    texte: "A few more stamps and it's yours.",
  },
  "programme-invalide": {
    emoji: "🎁",
    titre: "Something's missing",
    texte: "Check the reward and the number of visits. The alcohol-free version is optional – but not a drop of alcohol in it!",
  },
  "proposition-invalide": {
    emoji: "✏️",
    titre: "Your suggestion doesn't go through",
    texte: "Change at least one detail, with no swearing or overly long text, and check the phone number and website.",
  },
  "rien-a-changer": {
    emoji: "🤔",
    titre: "Nothing has changed",
    texte: "Everything you're suggesting is already on the page. Thanks for checking all the same!",
  },
  "lieu-inconnu": {
    emoji: "🔍",
    titre: "Place not found",
    texte: "This place is no longer on SOS Miam, or it isn't published yet.",
  },
  "trop-de-suggestions": {
    emoji: "✏️",
    titre: "Lots of suggestions in one go",
    texte: "You've already sent lots today, or this place already has several waiting. The team is reviewing them – try again tomorrow.",
  },
  "lieu-non-verifie": {
    emoji: "🛟",
    titre: "No rescues here yet",
    texte: "This place hasn't been verified by the team yet. Keep it up your sleeve – you'll be able to lend a hand soon.",
  },
  "plus-de-rescousse": {
    emoji: "🛟",
    titre: "You've given all 3 rescues",
    texte: "Well done, you gave it your all this week! They're back on Monday.",
  },
  "publication-inconnue": {
    emoji: "🔍",
    titre: "Post not found",
    texte: "It's been removed or is no longer online.",
  },
  "infos-invalides": {
    emoji: "📋",
    titre: "A detail doesn't go through",
    texte: "Check the phone number (a French one), the website (https) and the Instagram name.",
  },
  "carte-invalide": {
    emoji: "🍽️",
    titre: "Your menu doesn't go through",
    texte: "Check the names (no swearing or overly long text) and the prices, like 12 or 4.50.",
  },
  "reglement-invalide": {
    emoji: "🧾",
    titre: "This payment doesn't go through",
    texte: "Choose paid, discounted or gifted, and the perks from the list.",
  },
  "avis-pas-ouvert": {
    emoji: "🕐",
    titre: "Your review opens soon",
    texte: "An hour after your visit, with a clear head. Not in front of the owner.",
  },
  "avis-deja-donne": {
    emoji: "💬",
    titre: "You've already left your review",
    texte: "Thanks, it counts! One review per visit.",
  },
  "avis-invalide": {
    emoji: "✍️",
    titre: "Your review needs a little touch-up",
    texte: "Between 10 and 1,000 characters, no insults. Criticism is allowed!",
  },
  "compte-rendu-invalide": {
    emoji: "✍️",
    titre: "Tell us a bit more",
    texte: "Between 5 and 2,000 characters, no insults.",
  },
  "deja-relu": {
    emoji: "👀",
    titre: "Already reviewed",
    texte: "This review already has your verdict, thanks!",
  },
  "deja-sur-place": {
    emoji: "📍",
    titre: "Your attendance is already noted",
    texte: "No need to say it again – the team already has the time of your visit. All that's left is your write-up.",
  },
  "lieu-sans-position": {
    emoji: "🧭",
    titre: "This place doesn't have its pin yet",
    texte: "Without it, there's no way to check you're there. Describe your visit in your write-up – that's enough for the team.",
  },
  "pas-miam-safe": {
    emoji: "🛟",
    titre: "This venue doesn't receive alerts",
    texte: "It hasn't signed the Miam Safe charter. Call the emergency services if you're in danger, or alert a friend.",
  },
  "charte-retiree": {
    emoji: "🛡",
    titre: "Charter withdrawn by the team",
    texte: "The SOS Miam team has withdrawn this venue's charter. Write to us at bonjour@sosmiam.fr to talk about it.",
  },
  "visite-requise": {
    emoji: "🧾",
    titre: "Only after a visit",
    texte: "We ask you this after a confirmed visit to this place. That's what makes the label reliable.",
  },
  "pote-inconnu": {
    emoji: "👋",
    titre: "This person is no longer one of your friends",
    texte: "We can only alert one of your friends. Call them directly, or call the emergency services if you're in danger.",
  },
  "partage-inconnu": {
    emoji: "📍",
    titre: "Sharing not found",
    texte: "This location sharing no longer exists, or it isn't meant for you.",
  },
  "partage-termine": {
    emoji: "📍",
    titre: "Sharing has ended",
    texte: "The location is no longer shared. The hour is up, or sharing was stopped.",
  },
  "position-non-partagee": {
    emoji: "📍",
    titre: "Location not shared",
    texte: "You chose not to share your location with this friend, so nothing is sent.",
  },
  ...MESSAGES_SERVICES_SOCIAUX_ANGLAIS,
  ...MESSAGES_CONNEXION_QR_ANGLAIS,
  ...MESSAGES_RESERVATIONS_ANGLAIS,
  ...MESSAGES_SERVICES_COMMUNAUTE_ANGLAIS,
  ...MESSAGES_CARRIERE_ANGLAIS,
  ...MESSAGES_SECURITE_ANGLAIS,
  ...MESSAGES_IMAGES_LIEU_ANGLAIS,
  ...MESSAGES_ACTUS_ANGLAIS,
};
