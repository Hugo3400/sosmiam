import { ARTICLES_ACTUS_PAR_SEMAINE, COMMENTAIRE_ACTUS_MAX, PHOTOS_ACTUS_MAX, POINTS_ARTICLE_ACTUS, REPONSE_LIEU_ACTUS_MAX, TEXTE_ACTUS_MAX, TEXTE_ACTUS_MIN, TITRE_ACTUS_MAX, TITRE_ACTUS_MIN } from "../../../../../../packages/commun/src/regles/actus.ts";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionActusCguAnglais: SectionLegale = {
  id: "actus",
  titre: "News from the Miamis",
  blocs: [
    "In the app (the “News” tab of “For you”) and on [sosmiam.fr/actus](/actus), **News from the Miamis** features venues published on SOS Miam: a venue portrait, the neighbourhood top picks (3 to 5 venues), the deal of the moment (with an end date) and the outing story (2 to 5 venues). For now, only **ambassadors** write them; writing will open to the other Miamis later, always 18 or over.",
    {
      liste: [
        "**The Brigade reviews every article** before it appears (here, the Brigade means the SOS Miam team): it publishes it, asks you to revise it (with a message) or declines it (with a reason, which you can contest). A published article can still be reported, and it is removed if it does not follow these rules.",
        `**What you write**: a title (${TITRE_ACTUS_MIN} to ${TITRE_ACTUS_MAX} characters), a short intro, a text (${TEXTE_ACTUS_MIN} to ${TEXTE_ACTUS_MAX} characters) and up to ${PHOTOS_ACTUS_MAX} photos, with **no more than ${ARTICLES_ACTUS_PAR_SEMAINE} articles sent per week**. You write about venues and what you experienced there, never about a named member of staff without their consent. The [community rules](#regles-communaute) apply.`,
        "**Your photos**: taken by you, or used with their author's consent, and without the recognisable face of anyone who has not agreed.",
        "**Trust**: a venue never pays you for an article, and it can neither commission one nor write about itself. If a venue has given you something (a meal, a drink, an invitation), your article must say so with the French label {fr:Collaboration commerciale} (a paid or gifted partnership).",
        "**Alcohol**: never any encouragement to drink. Under an article that mentions it, the health warning is added automatically, and such an article is never shown to anyone without an account.",
        `**The venue**: a verified venue is notified when an article mentions it. It can leave a public reply (no more than ${REPONSE_LIEU_ACTUS_MAX} characters), reviewed by the Brigade before it appears, and report the article.`,
        `**Readers**: with an account, people can like an article, comment on it (no more than ${COMMENTAIRE_ACTUS_MAX} characters, with the same rules as [comments](#commentaires)) and send it to a friend; without an account, they can only read it. A published article also appears in the Following feed of the people who follow you.`,
        `**What you get**: ${POINTS_ARTICLE_ACTUS} points per published article, and badges (for your 1st, 5th and 20th published article). Never money.`,
        `**Your rights over your article**: you remain the author of your text and your photos. By sending it, you allow us to display it free of charge in the app and on sosmiam.fr, for as long as it is published. To have one of your articles removed, email us at ${lienContact}; and if you delete your account, your articles go with it.`,
      ],
    },
  ],
};
