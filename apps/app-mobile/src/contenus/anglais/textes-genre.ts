import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { OPTIONS_GENRE, TEXTES_GENRE } from "~/contenus/textes-genre";

export const TEXTES_GENRE_ANGLAIS: Traduction<typeof TEXTES_GENRE> = {
  titre: "My gender",
  intro: "Optional. It's used for one thing only: showing you restricted meetups (women only, men only, other genders).",
  personne: "Nobody can see it: not other Miamis, not places, not the meetups you go to.",
  legende: "Choose my gender",
  regle: "You can change it once a month, so restricted meetups stay with the right people.",
  bloque: (date: string) => `Saved. Your next change is possible on ${date} (once a month).`,
  toujoursPossible: "“I'd rather not say” and clearing it are still available whenever you like.",
  jamaisTitre: "What we'll never ask you",
  jamaisTexte: "Your orientation. “LGBT+ friendly” is a meetup tag that anyone can pick or filter by, not a box on your profile.",
  enregistrer: "Save changes",
  enregistre: "Saved",
  indiceEnregistrer: "After that, one change a month.",
  annonceEnregistre: "✅ Noted, and it stays between us.",
  effacer: "Clear my gender",
  effacerTexte: "We no longer keep your gender, not even “I'd rather not say” – just the date of your last choice, for the once-a-month rule. You'll then see meetups open to everyone.",
  annonceEfface: "🧽 Cleared – we no longer keep your gender.",
  rien: "Nothing chosen yet: you see meetups open to everyone. And that's absolutely fine too.",
  envoiRate: "That didn't go through. Check your connection and try again in a moment?",
  indisponible: "Option paused until your next possible change.",
  ligneReglage: "My gender",
  ligneVide: "Optional, and invisible to others",
};

export const OPTIONS_GENRE_ANGLAIS: Traduction<typeof OPTIONS_GENRE> = [
  { id: "femme", nom: "Woman", effet: "You'll also see “Women only” meetups." },
  { id: "homme", nom: "Man", effet: "You'll also see “Men only” meetups." },
  { id: "autre", nom: "Other", effet: "You'll also see “Other genders” meetups." },
  { id: "ne-pas-dire", nom: "I'd rather not say", effet: "You'll see meetups open to everyone, not restricted ones." },
];
