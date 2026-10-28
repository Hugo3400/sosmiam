import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  REFUS_LIMITATION_MIAMIS,
  TEXTES_ACCES_MIAMIS,
  TEXTES_ACCUEIL_MIAMIS,
  TEXTES_ESPACE_COMMUNAUTE,
  TEXTES_MES_ENVIES,
} from "~/contenus/textes-miamis";

export const TEXTES_ESPACE_COMMUNAUTE_ANGLAIS: Traduction<typeof TEXTES_ESPACE_COMMUNAUTE> = {
  titre: "Community",
  messages: "Messages",
  bande: "My crew",
  miamis: "The Miamis",
  choisir: "Choose a space",
};

export const TEXTES_ACCUEIL_MIAMIS_ANGLAIS: Traduction<typeof TEXTES_ACCUEIL_MIAMIS> = {
  presentsSurtitre: (ville: string) => `${ville} · right now`,
  presentsTitre: (n: number) =>
    n === 0
      ? "Nobody around just yet. Why not get the ball rolling?"
      : n === 1
        ? "A fellow Miami is hanging around nearby. Come and say hi!"
        : `${n} Miamis are hanging around nearby. Come and say hi!`,
  presentsBouton: "Who's around?",
  presentsNote: "You only show up here if you've chosen to. Never your location, only your city.",
  sortiesTitre: "Meet the Miamis",
  organiser: "+ Organise",
  sortiesIntro: "Open to Miamis you don't know yet, always at a place listed on SOS Miam. The organiser approves everyone who joins. Your get-togethers with friends stay in “My crew”.",
  toutes: "All",
  mesEnvies: "What I'm into",
  tesEnvies: "What you're into: ",
  aucuneEnvie: "nothing picked yet",
  modifierEnvies: "Edit",
  aucuneSortie: "No meetups with this tag yet. Why not be the one to start the first?",
  aucuneEnvieChoisie: "First pick what you're into with “Edit” – we'll show you the meetups that suit you.",
  aucuneSortieTitre: "No meetups yet",
  aucuneSortieTexte: "The Miamis in your city haven't started anything yet. A brunch, a restaurant, a crêpe crawl – fancy doing the honours?",
  organiserBouton: "Start the first one",
  astuceGenre: "Restricted meetups (women only, men only, other genders) unlock with My gender: optional, and nobody sees it.",
  astuceGenreLien: "Choose my gender",
  filTitre: "What the Miamis are up to",
  filVide: "It's quiet… too quiet. Start a get-together and wake up the Brigade!",
};

export const TEXTES_MES_ENVIES_ANGLAIS: Traduction<typeof TEXTES_MES_ENVIES> = {
  titre: "What I'm into",
  sousTitre: "The tags you're into: we put the meetups that suit you first (“Your kind of thing”).",
  note: "They stay on your phone – nobody else can see them.",
  enregistrer: "Got it",
  annuler: "Cancel",
};

export const REFUS_LIMITATION_MIAMIS_ANGLAIS: Traduction<typeof REFUS_LIMITATION_MIAMIS> = {
  venir: "Your account is restricted: asking to join an open meetup will have to wait until the restriction ends.",
};

export const TEXTES_ACCES_MIAMIS_ANGLAIS: Traduction<typeof TEXTES_ACCES_MIAMIS> = {
  visite: { emoji: "👋", titre: "The Miamis are waiting for you", texte: "Create your account to join meetups, vote for ideas and wave at the Miamis in your city." },
  bientot: { emoji: "🛠️", titre: "The Miamis are on their way", texte: "The Brigade is connecting open meetups, the suggestion box and “Who's around?” to the server. Just a little longer!" },
  reessayer: "Try again",
  retour: "Back",
};
