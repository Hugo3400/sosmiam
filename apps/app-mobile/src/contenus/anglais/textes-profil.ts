import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_BADGES_ANGLAIS } from "~/contenus/anglais/textes-badges";
import type {
  DETAILS_MODE_AMBASSADEUR,
  TEXTES_BADGES_PROFIL,
  TEXTES_COLLECTION,
  TEXTES_DEFIS_PROFIL,
  TEXTES_ESPACES,
  TEXTES_PALIER,
  TEXTES_PROFIL,
  TEXTES_RACCOURCIS,
} from "~/contenus/textes-profil";

export const TEXTES_PROFIL_ANGLAIS: Traduction<typeof TEXTES_PROFIL> = {
  modifier: "Edit my profile",
  indiceModifier: "Your avatar, your details, what you're into",
  voirMoins: "See less",
};

export const TEXTES_ESPACES_ANGLAIS: Traduction<typeof TEXTES_ESPACES> = {
  titre: "Your areas",
  pro: "Pro mode",
  plusieursLieux: (nombre: number, nom: string) => `${nombre} venues · ${nom}`,
  indicePro: "Opens your venue's counter",
  ambassadeur: "Ambassador mode",
  indiceAmbassadeur: "Opens your ambassador area",
};

export const DETAILS_MODE_AMBASSADEUR_ANGLAIS: Traduction<typeof DETAILS_MODE_AMBASSADEUR> = {
  actif: "Reviews to check, missions and messages",
  "en-attente": "Application in progress",
  suspendu: "Role on pause",
  refuse: "Not this time",
};

export const TEXTES_RACCOURCIS_ANGLAIS: Traduction<typeof TEXTES_RACCOURCIS> = {
  pasDeTable: "Book from a gem's page",
  rienDePrevu: "Nothing planned – fancy a gem?",
  fidelite: "Loyalty cards",
  indiceFidelite: "Opens your loyalty cards",
  fideliteEnLecture: "Your stamps and treats",
  pasDeCarte: "A stamp for every confirmed visit",
  cartes: (nombre: number) => `${nombre} card${nombre === 1 ? "" : "s"}`,
  cadeaux: (nombre: number) => (nombre === 1 ? "1 treat waiting for you 🎁" : `${nombre} treats waiting for you 🎁`),
  suivis: "You follow",
  indiceSuivis: "Opens the list of people, places and creators you follow",
  suivisEnLecture: "Miamis, places and creators",
  personne: "No one yet – tap “Follow”",
  visites: "My visits",
  indiceVisites: "Opens the list of your visits",
  visitesEnLecture: "Your visits and the reviews to write",
  visitesValidees: (nombre: number) => `${nombre} confirmed`,
  avisAEcrire: (nombre: number) => `${nombre} review${nombre === 1 ? "" : "s"} to write`,
  additionEnAttente: "A bill waiting",
  pasDeVisite: "Scan a counter QR code",
};

export const TEXTES_PALIER_ANGLAIS: Traduction<typeof TEXTES_PALIER> = {
  titre: "Your Ambassador level",
  sousTitre: "Your points, your numbers and this week's lifebuoys",
  points: (nombre: number) => `${nombre} point${nombre === 1 ? "" : "s"}`,
  rescousses: (nombre: number) => (nombre > 0 ? `${nombre} rescue${nombre === 1 ? "" : "s"} to give` : "all your rescues given out"),
  plusQue: (reste: number, palier: string) => `${reste} more point${reste === 1 ? "" : "s"} and you're a ${palier}`,
  nommeParLEquipe: (palier: string) => `Next step: ${palier}, chosen by the SOS Miam team from your city's founders`,
  toutEnHaut: "You're right at the top. Hats off – the whole city owes you one!",
  vers: (emoji: string, palier: string) => `Towards ${emoji} ${palier}`,
  versLu: (palier: string) => `Towards ${palier}`,
  avancee: (fait: number, objectif: number) => `${fait} / ${objectif}`,
  avanceeLue: (fait: number, objectif: number) => `${fait} of ${objectif} points`,
  palierRempli: "Level complete",
  commentGagner: "How do I earn points?",
  indiceCommentGagner: "Opens the explanation of points",
  introPoints: "Everything you do for local places earns you points:",
  bareme: [
    { emoji: "🧾", action: "A confirmed visit", gain: `+${POINTS_AMBASSADEUR.visite} points, and even +${POINTS_AMBASSADEUR.visiteSos} during an SOS` },
    { emoji: "📸", action: "A verified review with a photo of your plate", gain: `+${POINTS_AMBASSADEUR.avisPhoto} points` },
    { emoji: "🔎", action: "A place you suggest that joins SOS Miam", gain: `+${POINTS_AMBASSADEUR.proposerLieu} points` },
    { emoji: "🚀", action: "The very first rescue for a place that's just joined", gain: `+${POINTS_AMBASSADEUR.premierSauveteur} points` },
    { emoji: "🛟", action: "Every rescue", gain: `+${POINTS_AMBASSADEUR.rescousse} points` },
    { emoji: "🎯", action: "A completed challenge", gain: "the points it offers" },
  ],
  repasOffert: "A meal gifted by the venue doesn't earn points, photo included – the plate is the treat!",
  compris: "Got it",
};

export const TEXTES_DEFIS_PROFIL_ANGLAIS: Traduction<typeof TEXTES_DEFIS_PROFIL> = {
  voirAutres: (nombre: number) => (nombre === 1 ? "See the other challenge" : `See the ${nombre} other challenges`),
  voirMoinsLu: "See fewer challenges",
};

export const TEXTES_BADGES_PROFIL_ANGLAIS: Traduction<typeof TEXTES_BADGES_PROFIL> = {
  titre: "Your badges",
  derniers: (nombre: number) => (nombre === 1 ? "Your very first" : `Your latest ${nombre}`),
  apercuLu: (noms: readonly string[]) =>
    noms.length > 1 ? `Your latest ${noms.length} badges: ${noms.slice(0, -1).join(", ")} and ${noms[noms.length - 1]}` : `Your very first badge: ${noms[0] ?? ""}`,
  encore: (nombre: number) => `${nombre} more to unlock – happy hunting!`,
  complete: TEXTES_BADGES_ANGLAIS.collectionComplete,
  dernier: (emoji: string, nom: string) => `The latest: ${emoji} ${nom}`,
  aucun: "Your first badge is waiting – one rescue is all it takes!",
  voirTout: "See all your badges",
  indiceVoirTout: "Opens all your badges, sorted by family",
};

export const TEXTES_COLLECTION_ANGLAIS: Traduction<typeof TEXTES_COLLECTION> = {
  titre: "Your collection",
  sousTitre: "Your saved places and your favourites",
  compte: (gardes: number, jaimes: number) => `${gardes} saved · ${jaimes} like${jaimes === 1 ? "" : "s"}`,
  vide: "Nothing saved yet – your feed is full of gems",
  dernierGarde: (nom: string) => `Last saved: ${nom}`,
  voirGardes: (nombre: number) => `See your ${nombre} saved place${nombre === 1 ? "" : "s"}`,
  voirJaimes: (nombre: number) => `See your ${nombre} like${nombre === 1 ? "" : "s"}`,
  voirMoinsGardesLu: "See fewer saved places",
  voirMoinsJaimesLu: "See fewer likes",
};
