import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentAgeAnglais: DocumentLegal = {
  titre: "Age and SOS Miam",
  description:
    "SOS Miam is for over-18s: why, what we check when you sign up and what parents need to know.",
  miseAJour: "15 October 2026",
  introduction: [
    "SOS Miam is the app for heading out to discover independent restaurants, patisseries, bars and things to do that would love a few more faces. This page explains how old you need to be to use it, what you'll find on it and what we do if someone younger comes along. It's also a guide for parents.",
  ],
  enBref: [
    "To create an account, you need to be **18 or over**, in the app and on the site alike. Without an account, you can look around the app in a mode that's **suitable for all ages**, with no bars and no alcohol. And there's **nothing to buy**.",
  ],
  sections: [
    {
      id: "dix-huit-ans",
      titre: "18 or over",
      blocs: [
        "To create an SOS Miam account, you need to be **of legal age**, which in France means **18**. For now, SOS Miam is only open in France. If it ever opens elsewhere, the age will be that country's age of majority.",
        "The rule is the same everywhere: in the app, in the ambassador area and in the pro area. It has bars, get-togethers and other Miamis to meet, so we've chosen to keep SOS Miam for grown-ups.",
        "When you sign up, the app asks for your date of birth. If you're not 18 yet, it tells you so kindly and doesn't create an account. All it remembers, on your phone, is the date of your 18th birthday, so that sign-up stays closed until then. Your date of birth itself isn't kept. We'll be waiting for you with a slice of cake!",
        `On the site, the ambassador area ([${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})) and the pro area also ask for your date of birth. With your email and a password, it's only used to check that you're 18 or over, and isn't kept. With Apple or Google, it's kept encrypted, as in the app.`,
        "We don't ask for ID: we trust you. Lying about your age is prohibited by our [Terms of Use](/cgu), and if we find out that an account was created by lying about age, we delete it along with its data.",
      ],
    },
    {
      id: "sans-compte",
      titre: "Without an account: suitable for all ages",
      blocs: [
        "You can have a look around the app without creating an account. As we don't know your age, it then stays **suitable for all ages**:",
        {
          liste: [
            "**bars don't appear**;",
            "nothing to do with **alcohol** is shown.",
          ],
        },
        "Restaurants, patisseries, bowling alleys, event venues and things to do are all still there, of course. To like, save, follow or get a visit confirmed, you need an account, so you need to be 18 or over.",
      ],
    },
    {
      id: "contenus",
      titre: "What you'll find in the app",
      blocs: [
        {
          liste: [
            "**Independent places** near you, all over France, some of them going through a really tough time (places with a BIG SOS).",
            "**Videos and photos** posted by places and by creators, and **reviews** from people who've really been there.",
            "**Points, levels and badges** (Taster, Gem Hunter…): they reward your visits, with no element of chance and no money at stake.",
            "**Bars**: anything to do with alcohol comes with the health warning, and nothing there encourages you to drink.",
          ],
        },
        "**Everything is free**: there's nothing to buy in the app, no subscription, no in-app purchases and no loot boxes.",
        "With an account, **friends in the same crew** can message each other: messages, photos, voice notes, groups and get-togethers. Following someone never opens up messaging, and you can report or block at any time (see the [Terms of Use](/cgu#messagerie)).",
        "There's no advertising yet. It will come later: it will always be labelled as such, and this page will be updated **before** it arrives.",
      ],
    },
    {
      id: "securite",
      titre: "Posts and safety",
      blocs: [
        "What people post must follow the community rules, set out in our [Terms of Use](/cgu): no hate, no harassment, no violence, no sexual content, nothing dangerous. On this, it's **zero tolerance**.",
        "Under every post, the “⋯” menu lets you **report** it in a few seconds. With an account, you can also report a comment, a message, a list, a profile, a group or a get-together, and block someone. A post reported for violence or sexual content is **hidden from everyone from the very first report**, until a member of the SOS Miam team looks at it (for a comment, a message or a list, under a few conditions set out in the [Terms of Use](/cgu#moderation)). A human always makes the decision, not an algorithm.",
        "For serious content, the app also reminds you what to do: **17** (police) or **112** in an emergency, and [Pharos](https://www.internet-signalement.gouv.fr), the official French platform, to report illegal content to the authorities.",
      ],
    },
    {
      id: "parents",
      titre: "For parents",
      blocs: [
        "SOS Miam isn't designed for under-18s. A few pointers:",
        {
          liste: [
            "on iPhone, **Screen Time** and **Family Sharing** let you choose which apps can be downloaded; on Android, **Family Link** does the same;",
            "without an account, the app stays suitable for all ages: no bars, no alcohol;",
            "date of birth is only used to check age; we never sell anyone's data;",
            "if your child is under 18 and has created an account anyway, contact us: we'll delete it along with its data.",
          ],
        },
        "What we do with data is set out in the [privacy policy](/confidentialite).",
      ],
    },
    {
      id: "contact",
      titre: "Contact us",
      blocs: [
        `A question, a doubt, some content that worries you? Contact us at ${lienContact}. We read every message.`,
      ],
    },
  ],
  chapitres: [
    { id: "qui-peut-utiliser", titre: "Who can use SOS Miam", sections: ["dix-huit-ans", "sans-compte"] },
    { id: "dans-l-app", titre: "What you'll find in the app", sections: ["contenus", "securite"] },
    { id: "reperes-parents", titre: "For parents", sections: ["parents"] },
    { id: "nous-ecrire", titre: "Contact us", sections: ["contact"] },
  ],
};
