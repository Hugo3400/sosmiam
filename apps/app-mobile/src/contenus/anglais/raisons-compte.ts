import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ChoixRaisonCompte, raisonsCompte } from "~/contenus/raisons-compte";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

const raisons: Record<RaisonCompte, Omit<ChoixRaisonCompte, "titre">> = {
  rescousse: {
    emoji: "🛟",
    action: "give a rescue",
    phrase: "Your 3 rescues for the week are ready and we're keeping them warm for you. All they need now is you.",
  },
  jaime: {
    emoji: "❤️",
    action: "like this post",
    phrase: "We saw your heart skip a beat. With an account, everything you love stays tucked away in your profile.",
  },
  commenter: {
    emoji: "💬",
    action: "join the conversation",
    phrase: "Comment, reply, applaud the best one-liner: all that's missing is your two pennies' worth.",
  },
  suivre: {
    emoji: "⭐",
    action: "follow your favourites",
    phrase: "Their news will go to the top of your feed. Like the morning paper, only tastier.",
  },
  garder: {
    emoji: "📌",
    action: "save this place",
    phrase: "We'll put it aside for you, promise. It'll wait patiently in your profile, like the last slice of cake.",
  },
  partager: {
    emoji: "📣",
    action: "share the best finds",
    phrase: "Passing round the best addresses is our favourite sport. All that's missing is your team shirt.",
  },
  envoyer: {
    emoji: "💌",
    action: "send it to a friend",
    phrase: "Your crew deserves to know! Sign up, add your friends, and all that's left is picking a time.",
  },
  masquer: {
    emoji: "🙈",
    action: "tune your feed to your taste",
    phrase: "Not your thing? No worries. With an account, we remember what you like and show you less of this.",
  },
  signaler: {
    emoji: "🚩",
    action: "report a problem to us",
    phrase: "Thanks for keeping an eye out! An account helps us take every report seriously (and avoid a flood of reports).",
  },
  potes: {
    emoji: "👯",
    action: "find your friends",
    phrase: "Your crew, your get-togethers, your chats: it's all waiting just the other side of signing up.",
  },
  profil: {
    emoji: "🙋",
    action: "get your own profile",
    phrase: "Your avatar, your points, your badges: your very own shop window is just waiting for you.",
  },
  scan: {
    emoji: "📷",
    action: "get your visits confirmed",
    phrase: "One scan and your visit counts, for the place and for your points. We just need to know who to give them to!",
  },
  defis: {
    emoji: "🏆",
    action: "take on challenges",
    phrase: "Tasty challenges, points up for grabs, and your pride for dessert.",
  },
  "miam-safe": {
    emoji: "🛡️",
    action: "use Miam Safe",
    phrase: "Alerting a friend, alerting the staff, telling us what happened: an account lets us take every alert seriously.",
  },
  proposer: {
    emoji: "✏️",
    action: "suggest a change",
    phrase: "Opening hours that have moved, a new phone number: thanks to you, the pages stay accurate. All that's missing is your account.",
  },
  interesse: {
    emoji: "🎟️",
    action: "save this event",
    phrase: "A gig, a quiz, a tasting? With an account, we'll put it aside for you and remind you on the day if you like.",
  },
};

export const raisonsCompteAnglais: Traduction<typeof raisonsCompte> = Object.fromEntries(
  Object.entries(raisons).map(([cle, raison]) => [cle, { ...raison, titre: `Create your account to ${raison.action}` }]),
) as Record<RaisonCompte, ChoixRaisonCompte>;
