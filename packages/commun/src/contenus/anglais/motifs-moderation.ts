import type { MotifModeration } from "../motifs-moderation.ts";

export const DETAILS_MOTIFS_MODERATION_ANGLAIS: Readonly<Record<MotifModeration, { libelle: string; regle: string; enClair: string }>> = {
  "fausse-info": {
    libelle: "False information",
    enClair: "false information",
    regle: "no false information: a made-up or closed venue, a fake SOS, misleading prices or opening hours, a review without a visit, paid for or written to harm a competitor",
  },
  "pub-cachee": { libelle: "Hidden advertising or spam", enClair: "hidden advertising", regle: "no hidden advertising or spam" },
  arnaque: { libelle: "Scam", enClair: "a scam", regle: "no scams: asking for money or bank details, fake competitions, dubious links" },
  haine: { libelle: "Hate or harassment", enClair: "hateful content", regle: "no hate or harassment: insults, mockery, discrimination, threats" },
  violence: { libelle: "Violence, nudity or sexual content", enClair: "violence", regle: "no violence, nudity or sexual content" },
  danger: { libelle: "Putting people in danger", enClair: "putting people in danger", regle: "nothing that puts people in danger: drugs, alcohol offered to minors, dangerous challenges, weapons" },
  "vie-privee": {
    libelle: "Privacy",
    enClair: "invasion of privacy",
    regle: "nothing that infringes privacy: filming or showing someone without their consent, publishing their personal information",
  },
  droits: { libelle: "Other people's content", enClair: "copyright", regle: "no other people's content (video, photo, music, text) without their consent" },
  triche: { libelle: "Cheating or false reports", enClair: "cheating", regle: "no cheating, and no deliberately reporting posts that follow the rules" },
  usurpation: { libelle: "Impersonation", enClair: "impersonation", regle: "no passing yourself off as someone else, or as a venue you do not represent" },
  illegal: { libelle: "Illegal content", enClair: "illegal content", regle: "nothing illegal" },
};
