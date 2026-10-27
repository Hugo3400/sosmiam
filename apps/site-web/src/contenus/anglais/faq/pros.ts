import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { QUESTIONS_PROS } from "~/contenus/faq/pros";

export const QUESTIONS_PROS_ANGLAIS: Traduction<typeof QUESTIONS_PROS> = {
  "faq-prix": {
    question: "How much does it cost?",
    motsCles: ["price", "pricing", "rates", "subscription", "paid", "pay"],
    reponse: [
      "Nothing, ever. Your listing and all the tools are free: photos, opening hours, verified reviews, table card, tonight's SOS, detailed stats and events. No subscription, no commitment, and zero commission on your bookings.",
      "SOS Miam is funded by advertising, always clearly labelled and with no effect on the rankings.",
    ],
  },
  "faq-qui-peut": {
    question: "Who can sign up?",
    reponse: [
      "Every independent venue: restaurants, patisseries, bakeries, cafés, bars, wine shops, bowling alleys, event venues and places for things to do (escape rooms, workshops, water sports…). Got two or three sites? No worries, as long as you're not a chain or a franchise.",
    ],
  },
  "faq-image": {
    question: "Won't “SOS” give my venue a bad image?",
    reponse: [
      "No. Most of the time, an SOS just means “we've got tables tonight, come on in”. And if one day you're going through a really tough time, that's what the [BIG SOS](/faq#faq-big-sos) is for – told with kindness, never with pity. Either way, you decide if and when to send out an SOS: your listing does just fine without one.",
    ],
  },
  "faq-lancer-sos": {
    question: "How do I send out an SOS for tonight?",
    reponse: [
      "From your pro area, in one tap: you set the number of seats and until what time, with a little offer if you like (a dessert, a coffee…). Local customers who've turned on alerts get notified, and you see who's coming in real time.",
    ],
  },
  "faq-payer-classement": {
    question: "Can I pay to rank higher?",
    reponse: [
      "No, never. Rankings depend on rescues and confirmed visits. Ads are always clearly labelled as such and make no difference to the rankings.",
    ],
  },
  "faq-kit-qr": {
    question: "How does the QR code work?",
    reponse: [
      "When you sign up, you get your kit: a window sticker and table tents with your QR code, which opens your listing in the app. To leave a rating, a customer must have paid: they ask for the bill in the app and you mark it as paid in one tap, or your connected till prints a QR code on their receipt. That's what makes reviews verified and keeps your loyalty card going.",
    ],
  },
  "faq-avis-negatif": {
    question: "What if I get a bad review?",
    reponse: [
      "Only customers who've actually paid at your venue can leave a review: no fake reviews, no anonymous score-settling. You can reply publicly to every review and report the ones that break the rules. But we won't remove a review just because it's critical.",
    ],
  },
  "faq-fidelite": {
    question: "Who pays for the loyalty card reward?",
    reponse: [
      "You do, and you choose it: a coffee, a dessert, a drink… You also set how many visits it takes (5 by default). For you, it's a customer who comes back; for them, a good reason to come back.",
    ],
  },
  "faq-reservations-pro": {
    question: "How do bookings work?",
    reponse: [
      "If you turn them on, customers send you a request (number of people, time slot): you accept or decline in one tap, and they get notified. No software to install, and zero commission on bookings.",
    ],
  },
  "faq-technique": {
    question: "I'm not a tech person – is it complicated?",
    reponse: [
      "Not at all. You set up your listing in 5 minutes from your phone: photos, opening hours, your signature dish.",
    ],
  },
  "faq-arreter": {
    question: "Can I stop whenever I want?",
    reponse: [
      "Yes. There's no subscription and no commitment: you can delete your listing at any time from your pro area.",
    ],
  },
};
