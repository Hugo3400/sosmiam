import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionSignalerImageAnglais: SectionLegale = {
  id: "signaler-image",
  titre: "Reporting an image of a venue",
  blocs: [
    "On the page of a “Verified ✓” venue, on the site and in the app, “Report an image” lets the SOS Miam team know that a banner or logo is a problem. **On the site, you don't need an account**: we don't ask for your name or your email, and the venue will never know who reported it. The moderation rules are in the [Terms of Use](/cgu#moderation).",
    {
      liste: [
        "**What we keep**: the image concerned (the banner or logo of a given venue), your reason, the detail you choose and your explanation if you write one, the date, and where the report came from (the site or the app). Alongside it, an **encrypted copy of the image** as it was, which serves as evidence, and the account of the manager who uploaded it, so that we can let them know if we remove it. From the app, with an account, the report is also linked to your account: that's what lets us tell you what we've decided, and count only one report per person.",
        "**Your IP address**: it's only used to limit the number of reports (10 every 10 minutes) and is never stored with your report.",
        "**Who sees it**: only the SOS Miam moderation team, in our management software. If the image is removed, the manager receives the rule concerned and the team's explanation, never the name of the person who reported it, nor their explanation.",
        "**Why, and on what basis**: to handle reports and provide a statement of reasons for our decisions, as the EU Digital Services Act requires us to (legal obligation, Article 6(1)(c) GDPR); to keep the evidence and spot abusive reports (legitimate interest, Article 6(1)(f) GDPR).",
        "**How long**: until the decision, then **1 year** after it (or after the review, if there is one), before it's deleted automatically. The encrypted copy of the image goes sooner: **6 months** after the decision. An image removed by moderation disappears from the page straight away, then from our server within 2 days.",
        "**Required?** The image concerned and the reason. The explanation is optional, except for “Something else” (at least 10 characters).",
      ],
    },
  ],
};
