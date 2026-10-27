import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import type { QUESTIONS_AMBASSADEURS } from "~/contenus/faq/ambassadeurs";

const lienEspace = `[${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})`;

export const QUESTIONS_AMBASSADEURS_ANGLAIS: Traduction<typeof QUESTIONS_AMBASSADEURS> = {
  "faq-devenir-ambassadeur": {
    question: "How do I become an ambassador?",
    reponse: [
      `Create your account on ${lienEspace} – you need to be 18 or over. The SOS Miam team checks every sign-up by hand; once yours is approved, your area opens up: media kit, places to suggest, missions. It's free, with no set hours or targets, and it's all explained on [the programme page](${adresseEspaceAmbassadeur}/en/programme).`,
    ],
    motsCles: ["sign up", "account", "area", "18", "over 18"],
  },
  "faq-ambassadeur-paye": {
    question: "Are ambassadors paid?",
    reponse: [
      "No. It's an adventure for enthusiasts, not a job. And an ambassador is never paid by a place they feature. If a place gives them something, they say so clearly, with the label “Collaboration commerciale” (a paid or gifted partnership).",
    ],
    motsCles: ["money", "salary", "payment", "gift"],
  },
  "faq-fondateurs": {
    question: "What's a founding ambassador?",
    reponse: [
      "One of the first ambassadors in their city, launching SOS Miam with us. The number of spots depends on the size of the city: 10 above 500,000 people, 5 from 200,000 to 500,000, 3 from 100,000 to 200,000 and 1 from 50,000 to 100,000. Smaller towns share 1 spot per département (a French administrative area), and each overseas territory has its own: 367 spots in all, opening at the same time all over France.",
      "Founders get a numbered card, “Founder #3 in Lyon · #147 in France” (to download and share straight away, with a real card posted later), their first name on a “Spotted by” window sticker, badges, and early access to the app, with a direct line to the SOS Miam team. To get to know each other: a video call of about 30 minutes with the founders in their city (or their region, for a département founder), and a one-to-one if needed.",
      `To apply, first create your account on ${lienEspace}. Once your account is approved, you apply from your area for the city you live in, or for your département if your town has fewer than 50,000 people, as long as there are spots left. Then the SOS Miam team chooses.`,
    ],
    motsCles: ["founder", "application", "city", "county", "spots", "card", "video call"],
  },
  "faq-fondateurs-complet": {
    question: "My city's full – what do I do?",
    reponse: [
      "When all the spots in a city (or a département) are taken, applications there close automatically, and reopen as soon as a spot frees up. There's no waiting list. And if a founder moves away, they keep their title as a keepsake, but their spot frees up. A founder number is never given out again: the next one in Lyon after #10 will be #11.",
    ],
    motsCles: ["founder", "full", "no spots left", "moving house", "move", "number"],
  },
  "faq-ambassadeur-certifie": {
    question: "What's a Certified Ambassador?",
    reponse: [
      "Someone who helps partner venues: an ambassador, a business (restaurant, shop…) or an organisation (association, town hall, tourist office, school…), represented by one person with their own account. It's a separate title, on top of your level.",
      `You become one by applying from your area on ${lienEspace} once your account is approved, or by invitation from the SOS Miam team, which makes the choice. You then get the “Certified Ambassador ✓” badge on the pages of the places you've helped (with your first name, and your organisation if you have one), missions at partner venues and a pro media kit to introduce SOS Miam to them. Soon, with the pro area, you'll also be able to contact venues through SOS Miam messages. There's no public list of Certified Ambassadors: just this badge.`,
      "And like every ambassador, a Certified Ambassador is never paid by a place: if a place gives them something, they label it “Collaboration commerciale” (a paid or gifted partnership).",
    ],
    motsCles: ["certified", "accreditation", "badges", "organisation", "charity", "town hall", "business", "pro media kit", "partner missions"],
  },
  "faq-createurs": {
    question: "I'm a content creator – how does it work?",
    reponse: [
      "Later on, venues will be able to ask creators for a video (“Come and film my restaurant”), with their terms shown upfront: a gifted meal or payment, and always the “Collaboration commerciale” label. It's not open yet – [leave your email](/#inscription) to hear more.",
    ],
  },
  "faq-sponsorise": {
    question: "Are videos paid for by a venue labelled?",
    reponse: [
      "Yes, always. As soon as a place offers a meal or pays for a video, it carries the label “Collaboration commerciale” (a paid or gifted partnership), as French law requires. You always know what's spontaneous and what isn't.",
    ],
  },
};
