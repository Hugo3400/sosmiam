import { COMMENTAIRE_ACTUS_MAX, PHOTOS_ACTUS_MAX, REPONSE_LIEU_ACTUS_MAX } from "../../../../../../packages/commun/src/regles/actus.ts";
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionActusAnglais: SectionLegale = {
  id: "actus",
  titre: "News from the Miamis",
  blocs: [
    "News from the Miamis is made up of articles about venues, written for now by ambassadors, reviewed by the Brigade (the SOS Miam team), then published in the app and on [sosmiam.fr/actus](/actus). The rules are in the [Terms of Use](/cgu#actus).",
    {
      liste: [
        `**What we keep about an article**: its text (title, intro, paragraphs, quote), its photos (no more than ${PHOTOS_ACTUS_MAX}, saved again without their metadata, such as location or device), the venues it mentions, its category and, for a deal, its end date, its dates, your account as its author, and the Brigade's decisions (published, to be revised with its message, declined or removed with its reason, and your complaint if you make one).`,
        "**What is public**: a published article, with your first name, your avatar and, if you are one, the ambassador badge. On sosmiam.fr, it can be found by search engines. The people who follow you also see it in their Following feed.",
        `**Likes and comments**: a like keeps your account and the article. A comment keeps its text (no more than ${COMMENTAIRE_ACTUS_MAX} characters), your account, the article, its date and the comment it replies to; it is shown with your first name and your avatar. If you delete it, it is erased straight away, or only emptied of its text (“Comment deleted”) if it has replies.`,
        `**A venue's reply**: its text (no more than ${REPONSE_LIEU_ACTUS_MAX} characters), the venue, its date, the account of the manager who wrote it and the Brigade's decision. It is shown in the venue's name, never in the manager's.`,
        "**Reports** about an article, a reply or a comment follow the same rules as other reports (see “[Reporting and moderation in the social features](#signalements-sociaux)”). From the site, anyone can report an article or a reply without an account, just like an image (see “[Reporting an image of a venue](#signaler-image)”).",
        "**Why, and on what legal basis**: publishing the articles you write, showing them to readers and running likes and comments is the performance of the [Terms of Use](/cgu#actus) (Article 6(1)(b) GDPR). Reviewing, moderating, giving reasons for our decisions and letting you contest them is a legal obligation under the EU Digital Services Act (Article 6(1)(c) GDPR).",
        "**How long**: a published article stays as long as your account exists. If it is declined or removed, it is erased 6 months after the decision, your complaint included. A photo that was sent but never used in an article is erased after 25 hours. A comment removed by moderation stays hidden for 6 months (the time to contest it), then it is erased; it also goes with its article.",
        "**If you delete your account**: your articles, your likes and your comments go with it, venue replies included. A venue's reply also goes with the article or with the venue; if the account of the manager who wrote it is deleted, it stays, in the venue's name.",
      ],
    },
  ],
};
