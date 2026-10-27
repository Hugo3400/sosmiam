import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ACTUS_PRO } from "~/contenus/textes-actus-pro";

export const TEXTES_ACTUS_PRO_ANGLAIS: Traduction<typeof TEXTES_ACTUS_PRO> = {
  ligneTitre: "You're in the News",
  ligneDetail: "Stories that mention your place, and your public reply",
  titre: "You're in the News",
  intro: "When a News story mentions your place, you'll find it here. You can leave one public reply per story.",
  par: (prenom: string, date: string) => `By ${prenom} · published on ${date}`,
  lire: "Read the story",
  repondre: "Reply",
  reponses: {
    "en-relecture": "Your reply is being checked by the Brigade.",
    publie: "Your reply is live under the story.",
    refuse: "Your reply wasn't published.",
  },
  motif: (motif: string) => `Reason: ${motif}.`,
  reecrire: "Write a new reply",
  vide: "No stories mention your place yet. They'll come!",
  feuille: {
    titre: "Your public reply",
    sousTitre: (nom: string) => `Signed ${nom}, under the story.`,
    champ: "Your reply",
    placeholder: "A thank-you, a detail, an invitation…",
    compteur: (n: number, max: number) => `${n} / ${max}`,
    regle: "Checked by the Brigade before it appears. Say thanks, add a detail, invite people: never promote alcohol, never comment on the person who wrote it.",
    envoyer: "Send my reply",
    pasMaintenant: "Not now",
  },
  envoyee: "Reply sent: the Brigade will check it before it goes live.",
};
