import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  STATUTS_CARTE_AMBASSADEUR,
  TEXTES_AVIS_A_RELIRE,
  TEXTES_ECRAN_ESPACE_AMBASSADEUR,
  TEXTES_MESSAGES_AMBASSADEUR,
  TEXTES_MISSIONS_AMBASSADEUR,
  TEXTES_MOTIF_LOUCHE,
  TEXTES_ONGLETS_AMBASSADEUR,
  TEXTES_RELECTURES,
  TYPES_MISSION,
} from "~/contenus/textes-espace-ambassadeur";

export const TEXTES_ONGLETS_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_ONGLETS_AMBASSADEUR> = {
  ongletLu: (nom: string, position: number, total: number) => `${nom}, tab ${position} of ${total}`,
  espace: "Overview",
  missions: "My missions",
  relectures: "Reviews",
  messages: "Messages",
};

export const TEXTES_ECRAN_ESPACE_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_ECRAN_ESPACE_AMBASSADEUR> = {
  titre: "Overview",
  sousTitre: "The Brigade keeps an eye on local places",
  missionsAFaire: (nombre: number) => (nombre === 1 ? "mission to do" : "missions to do"),
  avisARelire: (nombre: number) => (nombre === 1 ? "review to check" : "reviews to check"),
  messagesNonLus: (nombre: number) => (nombre === 1 ? "unread message" : "unread messages"),
  ouverture: "Opening your area…",
  siteTitre: "Your whole area on the website",
  siteDetail: "City founders, place suggestions, Certified Ambassador: it's all on ambassadeur.sosmiam.fr",
  palier: "Your level and your points are on your profile, as usual.",
};

export const TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_MESSAGES_AMBASSADEUR> = {
  titre: "Messages",
  sousTitre: "News from the SOS Miam team",
  vide: "No messages yet – the SOS Miam team will write to you here.",
  nonLu: "Unread: ",
};

export const TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_MISSIONS_AMBASSADEUR> = {
  titre: "My missions",
  sousTitre: "What the SOS Miam team hands you, close to home",
  aFaire: (nombre: number) => `To do${nombre ? ` (${nombre})` : ""}`,
  rien: "Nothing for now, so enjoy it. The SOS Miam team will give you a shout as soon as a place could use your help.",
  faites: "Done",
  faiteLe: (jour: string) => `Done on ${jour}`,
  annulee: "Cancelled",
  avantLe: (jour: string) => `By ${jour}`,
  sansDate: "No deadline",
  carteLu: (type: string, titre: string, ou: string | null, quand: string) => `${type}: ${titre}${ou ? `, ${ou}` : ""}. ${quand}`,
};

export const TYPES_MISSION_ANGLAIS: Traduction<typeof TYPES_MISSION> = {
  "verifier-lieu": { emoji: "🔎", nom: "Check a place" },
  "verifier-big-sos": { emoji: "🆘", nom: "Check a BIG SOS" },
  "controler-lieu": { emoji: "🧐", nom: "Drop in on a place" },
  autre: { emoji: "🧭", nom: "Your mission" },
};

export const TEXTES_RELECTURES_ANGLAIS: Traduction<typeof TEXTES_RELECTURES> = {
  merci: { ok: "Thanks! Review checked.", louche: "Thanks! The SOS Miam team will take a look.", deporte: "Noted – another ambassador will check it." },
  dejaRelu: "Three ambassadors checked it in the meantime – thanks all the same!",
  titre: "Reviews to check",
  sousTitre: "Your view counts – the SOS Miam team has the final say",
  vide: "No reviews to check – everything's spick and span. Come back later, we'll keep some warm for you.",
};

export const TEXTES_AVIS_A_RELIRE_ANGLAIS: Traduction<typeof TEXTES_AVIS_A_RELIRE> = {
  photoLu: "Review photo",
  ok: "Looks fine",
  louche: "Looks dodgy",
  passer: "I'll pass",
  indicePasser: "If you know this place or the person, another ambassador will check it",
};

export const TEXTES_MOTIF_LOUCHE_ANGLAIS: Traduction<typeof TEXTES_MOTIF_LOUCHE> = {
  titre: "What seems off?",
  sousTitre: "Your view helps the SOS Miam team, and the team always has the final say. We never hide a review automatically.",
  envoyer: "Send to the team",
};

export const STATUTS_CARTE_AMBASSADEUR_ANGLAIS: Traduction<typeof STATUTS_CARTE_AMBASSADEUR> = {
  actif: { emoji: "🤝", titre: "Active ambassador", texte: "Thanks for keeping an eye on local places! Your missions, the reviews to check and messages from the SOS Miam team are all here." },
  "en-attente": { emoji: "⏳", titre: "Application in progress", texte: "The SOS Miam team is reading your application. We'll let you know as soon as it's sorted – keep your best apron handy." },
  refuse: { emoji: "🙏", titre: "Not this time", texte: "Your application hasn't been accepted for now. Keep rescuing tables – the door's still open." },
  suspendu: { emoji: "⏸️", titre: "Role on pause", texte: "Your ambassador role is on pause. A message from the SOS Miam team explains why on ambassadeur.sosmiam.fr." },
};
