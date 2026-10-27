import { site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentAccessibiliteAnglais: DocumentLegal = {
  titre: "Accessibility and SOS Miam",
  description:
    "What the SOS Miam app and site already do for accessibility, what's in progress, what's planned and how to report a problem to us.",
  miseAJour: "8 October 2026",
  introduction: [
    "We want everyone to be able to rescue a table, however they use a phone or a computer. This page is honest about where we stand: what already works, what's in progress and what's planned.",
  ],
  enBref: [
    `The app already follows your phone when you ask it to **reduce motion** or **make text larger**, and **VoiceOver and TalkBack support is in progress**. The site has a “Skip to content” link and turns off its animations if you ask it to. No audit has been carried out yet. Something getting in your way? Contact us at ${lienContact}.`,
  ],
  sections: [
    {
      id: "app",
      titre: "In the app",
      blocs: [
        "What already works:",
        {
          liste: [
            "**Reduce Motion**: the app follows this setting on your phone. The hearts and the lifebuoy that fly up, the flashing SOS frame, the photos that slide by on their own and the mascot all calm down.",
            "**Text size**: text follows the font size chosen in your phone's Settings app. We haven't yet checked that every screen holds up with a very large font.",
            "**Videos** in the feed have no sound for now, so there's nothing to subtitle.",
          ],
        },
        "What's in progress:",
        {
          liste: [
            "**VoiceOver (iPhone) and TalkBack (Android)**: many buttons and elements already have a name that's read aloud, but no one has tested the app from start to finish with these tools yet. Some screens may still get in your way, so let us know – it helps us know where to start.",
          ],
        },
      ],
    },
    {
      id: "prevu",
      titre: "What's planned",
      blocs: [
        "No dates for now: we'd rather tell you when something's done than make promises. Coming up:",
        {
          liste: [
            "VoiceOver and TalkBack on every screen;",
            "a layout that holds up with a very large font;",
            "more contrast for text placed over videos;",
            "a dark mode;",
            "subtitles as soon as videos include speech.",
          ],
        },
        "This page will be updated with each step forward.",
      ],
    },
    {
      id: "site",
      titre: "On the site",
      blocs: [
        {
          liste: [
            "A **“Skip to content”** link appears at the top of every page when you navigate with a keyboard, so there's no need to go through the menu every time.",
            "Pages declare their language (French, or English on the English version), so screen readers read them with the right pronunciation.",
            "If your device asks to **reduce motion**, the site turns off its animations.",
            "The forms (“Keep me posted” and “List my venue”) have visible labels. Their errors are written under the field concerned and read out by screen readers, the list of cities can be browsed with the keyboard (arrow keys, Enter, Esc), and the ticked option stays visible in high contrast mode.",
          ],
        },
        "We've checked these forms with a keyboard and with automated testing tools, but not yet with a screen reader from start to finish, and not yet across the whole site.",
      ],
    },
    {
      id: "audit",
      titre: "No audit yet",
      blocs: [
        "Neither the app nor the site has had an accessibility audit yet. So we don't claim any level of compliance with accessibility standards (the RGAA – the French accessibility standard – and the WCAG internationally). We'd rather tell you what really works, and what doesn't work yet.",
      ],
    },
    {
      id: "contact",
      titre: "Report a problem to us",
      blocs: [
        `A button that isn't read out, text that's too small, a screen you can't use? Contact us at ${lienContact}. We'll look into it and get back to you.`,
        "If you can, tell us which screen or page, which device and which tool (VoiceOver, TalkBack, zoom, high contrast…). It helps us fix things faster.",
      ],
    },
  ],
  chapitres: [
    { id: "l-app-ou-on-en-est", titre: "The app: where we stand", sections: ["app", "prevu"] },
    { id: "le-site-ou-on-en-est", titre: "The site: where we stand", sections: ["site"] },
    { id: "conformite", titre: "No audit yet", sections: ["audit"] },
    { id: "signaler-un-probleme", titre: "Report a problem to us", sections: ["contact"] },
  ],
};
