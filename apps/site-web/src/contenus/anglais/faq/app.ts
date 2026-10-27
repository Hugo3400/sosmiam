import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { QUESTIONS_APP } from "~/contenus/faq/app";

export const QUESTIONS_APP_ANGLAIS: Traduction<typeof QUESTIONS_APP> = {
  "faq-rescousse": {
    question: "What's a “rescue”?",
    reponse: [
      "It's your helping hand to a place. You get 3 a week, and they top up every Monday, so each one counts. The places that get the most move up the feed and get noticed.",
    ],
  },
  "faq-qr-code": {
    question: "How do I get my visit confirmed?",
    reponse: [
      "By paying. When it's time for the bill, ask for it in the app (“Ask for the bill with SOS Miam”): the staff mark it as paid in one tap. If the place has a connected till, scan the QR code printed on your receipt. A booking made in the app that you turn up for counts too. That's what unlocks your review, earns you points and fills up your loyalty card.",
      "It only works at a Verified ✓ place, one that has an SOS Miam account. A place that's not verified is in the app so you can discover it, but it can't confirm your visit – so no points or verified review there. You can still leave a review (marked “not verified”) and invite them to join us.",
    ],
  },
  "faq-avis-fiables": {
    question: "Can I trust the reviews?",
    reponse: [
      "Yes. You can only leave a rating after a verified purchase (bill paid, receipt scanned or booking honoured), and the invitation arrives an hour later – not under the owner's nose. A dodgy review gets checked by an ambassador, the average rating plays it safe, and we also show the share of customers who come back. No bought fake reviews, no competitors sneaking in ratings. A review left for a place that's not verified, with no confirmed visit, is marked “not verified”.",
    ],
  },
  "faq-recompenses": {
    question: "What's in it for me?",
    reponse: [
      "Every confirmed visit and every rescue earns you points: you move up the levels (Taster, Gem Hunter, Ambassador…) and unlock badges. At your favourite places, your loyalty card earns you the reward the place has chosen (a coffee, a dessert…). And there are challenges to take on and this month's leaderboard to climb with your crew.",
    ],
  },
  "faq-proposer": {
    question: "I know a hidden gem – can I suggest it?",
    reponse: [
      "Of course! Suggest it from the app. If it joins SOS Miam, its page shows “Spotted by” with your first name, and you earn the “Spotted by You” badge. And if you're the very first to give a rescue to a place that's just joined, you become its “First to the Rescue”.",
    ],
  },
  "faq-entre-potes": {
    question: "Can I organise a get-together with friends?",
    reponse: [
      "Yes. Create a get-together, suggest up to 3 places, and your friends vote. The winning place gets a rescue from everyone taking part. You can also follow your friends and share lists, like “Sunday brunches”.",
    ],
  },
  "faq-reserver": {
    question: "Can I book a table?",
    reponse: [
      "At places that take bookings, yes: you send a request (number of people, time slot) and the place replies with a notification. And when a place sends out an SOS, the “I'm going” button holds a seat for you for 20 minutes.",
    ],
  },
  "faq-notifications": {
    question: "Will I get loads of notifications?",
    reponse: [
      "No, you're in charge of all of it: the neighbourhoods you're interested in, the times you want to hear from us, or nothing at all. An alert looks like this: “The patisserie 200 m away is quiet tonight – a choux bun on the house”.",
    ],
  },
  "faq-donnees": {
    question: "What do you do with my data?",
    reponse: [
      "Only what's strictly needed to make the app work. Your location is only used to show you places around you, and only if you allow it. We never sell your data, and you can delete your account whenever you like.",
    ],
  },
};
