import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  TEXTES_ECRAN_CE_SOIR,
  TEXTES_ECRAN_FIDELITE,
  TEXTES_ECRAN_INFOS_PRATIQUES,
  TEXTES_ECRAN_KIT,
  TEXTES_ECRAN_MON_LIEU,
  TEXTES_ECRAN_STATISTIQUES,
} from "~/contenus/textes-ecran-pro-mon-lieu";

export const TEXTES_ECRAN_MON_LIEU_ANGLAIS: Traduction<typeof TEXTES_ECRAN_MON_LIEU> = {
  titre: "My venue",
  programmeVide: "No card yet – set yours up in a minute.",
  programmeActif: "live",
  programmeEnPause: "paused",
  programme: (visites: number, recompense: string, etat: string) => `${visites} visit${visites === 1 ? "" : "s"} → ${recompense} · ${etat}`,
  carteVide: "No menu yet – add your dishes and drinks.",
  carte: (sections: number, nombre: number) => `${sections} section${sections === 1 ? "" : "s"} · ${nombre} item${nombre === 1 ? "" : "s"} on the menu`,
  charteInconnue: "The charter, its commitments and your signature",
  charteSignee: "Charter signed",
  charteRetiree: "Withdrawn by the SOS Miam team",
  charteNonSignee: "Not signed yet – the badge on your listing, for free",
  verifieLu: "Verified venue: it has an SOS Miam account. It confirms visits, sends out SOS alerts and replies to reviews.",
  verifieTitre: "Verified venue",
  verifieTexte: "You confirm visits, send out SOS alerts and reply to reviews.",
  carteTitre: "The menu",
  fidelite: "Loyalty card",
  infos: "Good to know",
  infosDetail: "Phone, pets, access, terrace, payments… what people see on your listing",
  miamSafe: "Miam Safe",
  kit: "My kit",
  kitDetail: "Your window QR code, which opens your listing",
  equipe: "Staff and devices",
  equipeDetail: "Invite your staff – everyone gets their own account, so you know who confirmed what",
  ceSoir: "Tonight",
  ceSoirDetail: "Tonight's SOS and message of the moment – give local foodies a heads-up",
  evenements: "Events",
  evenementsDetail: "Gig, quiz, workshop: on your listing and for everyone who follows you",
  reglagesReservations: "Booking settings",
  avis: "Reviews",
  avisDetail: "What the Miamis say, and your public reply under each one",
  statistiques: "This week's stats",
  statistiquesDetail: "Listing views, rescues, confirmed visits, new customers",
};

export const TEXTES_ECRAN_KIT_ANGLAIS: Traduction<typeof TEXTES_ECRAN_KIT> = {
  retour: "Back",
  titre: "My kit",
  intro: "The QR code for your window and table stands: one scan and people land on your listing on SOS Miam.",
  qrLu: (lieu: string) => `Window QR code for ${lieu} – it opens your listing`,
  tonLieu: "your venue",
  chargement: "Getting your QR code ready…",
  bonASavoir: "🔒 Good to know",
  explication: "This QR code opens your listing. It never confirms a visit (that's the counter QR code, which changes every 30 seconds). A scan never asks for a password.",
  affichette: "The printable table card is in the Pro area of the website: pro.sosmiam.fr.",
  partager: "Share my listing",
  messagePartage: (lien: string) => `Find us on SOS Miam: ${lien}`,
};

export const TEXTES_ECRAN_INFOS_PRATIQUES_ANGLAIS: Traduction<typeof TEXTES_ECRAN_INFOS_PRATIQUES> = {
  retour: "Back",
  titre: "Good to know",
  intro: "What foodies see on your listing before they come. Anything you don't tick won't show.",
  apercu: "Preview on your listing",
  echec: "The info couldn't be saved. Try again in a moment?",
  enregistrement: "Saving…",
  enregistrer: "Save changes",
};

export const TEXTES_ECRAN_FIDELITE_ANGLAIS: Traduction<typeof TEXTES_ECRAN_FIDELITE> = {
  retour: "Back",
  titre: "Loyalty card",
  intro: "You're the one treating them, so you're the one choosing. Pick something you can keep up even on a packed Saturday night.",
  actif: "Card active",
  actifDetail: "When it's paused, your customers can't see it any more (rewards already earned stay valid for 30 days)",
  recompense: "What you're offering",
  recompenseAide: "A coffee, a homemade dessert, a scoop of ice cream…",
  alcoolDetecte: "🍷 There's alcohol in it: your customers will see the short health warning next to it.",
  alcool: "There's alcohol in it",
  sansAlcool: "And an alcohol-free version?",
  facultatif: "optional",
  sansAlcoolAide: "If you like, an extra idea without a drop of alcohol: a fresh juice, a homemade cordial…",
  visites: "Visits before the reward",
  visitesUnite: (n: number) => `${n} visit${n === 1 ? "" : "s"}`,
  echec: "The card couldn't be saved. Try again in a moment?",
  enregistrement: "Saving…",
  enregistrer: "Save the card",
  erreurs: {
    recompense: "3 to 60 characters, no rude words: a coffee, a homemade dessert…",
    recompenseSansAlcool: "3 to 60 characters, no rude words and not a drop of alcohol: a fresh juice, a homemade cordial…",
    visitesRequises: "Between 3 and 10 visits.",
  },
};

export const TEXTES_ECRAN_STATISTIQUES_ANGLAIS: Traduction<typeof TEXTES_ECRAN_STATISTIQUES> = {
  titre: "Statistics",
  semaine: (date: string) => `Week of ${date}`,
  vide: "No figures yet – they'll arrive with your first visits.",
  note: "Weeks run Monday to Sunday, Paris time. Views are counted without tracking anyone: we never know who looked.",
  mesures: {
    vues: "Listing views",
    rescousses: "Rescues received",
    visitesValidees: "Confirmed visits",
    nouveauxClients: "New customers",
  },
};

export const TEXTES_ECRAN_CE_SOIR_ANGLAIS: Traduction<typeof TEXTES_ECRAN_CE_SOIR> = {
  titre: "Tonight",
  sousTitre: "tonight's SOS and your message of the moment",
  sos: "Tonight's SOS",
  sosLance: "🛟 SOS sent out – local foodies are on their way!",
  sosArrete: "SOS ended. See you tomorrow for the next one!",
  message: "Message of the moment",
  messageAffiche: "📣 Message showing on your listing",
  messageEfface: "Message removed",
  alcool: "Anything about alcohol shows with the health warning, and never to people browsing without an account.",
};
