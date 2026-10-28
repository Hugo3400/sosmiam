import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { raisonsSignalement } from "~/contenus/raisons-signalement";

export const raisonsSignalementAnglais: Traduction<typeof raisonsSignalement> = [
  {
    cle: "faux-lieu",
    emoji: "🏚️",
    titre: "Fake place or false information",
    detail: "Closed or made-up place, fake SOS, misleading prices or opening hours",
    precisions: ["The place doesn't exist or has closed", "Fake SOS or fake offer", "Wrong prices, opening hours or address", "The pictures don't show this place"],
  },
  {
    cle: "pub-cachee",
    emoji: "📣",
    titre: "Hidden advertising or spam",
    detail: "Partnership not disclosed, posts on repeat",
    precisions: ["Partnership not labelled “Collaboration commerciale”", "Spam or repeated posts", "Advertising for something other than a place"],
  },
  {
    cle: "arnaque",
    emoji: "💸",
    titre: "Scam",
    detail: "Asking for money, fake competition, suspicious link",
    precisions: ["Asking for money or bank details", "Fake competition", "Suspicious link"],
  },
  {
    cle: "haine",
    emoji: "🤬",
    titre: "Hate or harassment",
    detail: "Insults, mockery, discrimination, threats",
    precisions: ["Hateful or discriminatory language", "Harassment or mockery", "Threats"],
    grave: true,
  },
  {
    cle: "choquant",
    emoji: "🔞",
    titre: "Violence or sexual content",
    detail: "Violent images, nudity, disturbing content",
    precisions: ["Violence or cruelty", "Nudity or sexual content", "Shocking or disturbing image"],
    grave: true,
  },
  {
    cle: "danger",
    emoji: "⚠️",
    titre: "Danger or banned product",
    detail: "Drugs, alcohol offered to minors, dangerous challenge",
    precisions: ["Drugs", "Alcohol offered to minors", "Dangerous challenge or behaviour", "Weapon"],
    grave: true,
  },
  {
    cle: "vie-privee",
    emoji: "🔒",
    titre: "Privacy",
    detail: "Someone filmed or shown without their consent",
    precisions: ["I appear without my consent", "Someone else appears without their consent", "Personal information is visible"],
  },
  {
    cle: "vol-contenu",
    emoji: "©️",
    titre: "Stolen video or photo",
    detail: "Content reused without its creator's permission",
    precisions: ["It's my content", "It's someone else's content"],
  },
  {
    cle: "autre",
    emoji: "💬",
    titre: "Something else",
    detail: "Tell us in your own words what's wrong",
    precisions: [],
  },
];
