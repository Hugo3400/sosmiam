import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  TEXTES_ANNONCE_PROFIL,
  TEXTES_BADGES_ONGLET_PROFIL,
  TEXTES_BOUEES_SEMAINE,
  TEXTES_CHIFFRES_PROFIL,
  TEXTES_COLLECTIONS_PROFIL,
  TEXTES_EN_TETE_PROFIL,
  TEXTES_ENTREE_SUIVIS,
  TEXTES_ECRAN_SUIVIS,
} from "~/contenus/textes-profil-onglet";

export const TEXTES_EN_TETE_PROFIL_ANGLAIS: Traduction<typeof TEXTES_EN_TETE_PROFIL> = {
  parametres: "Settings",
  indiceParametres: "Your account, your alerts and your data",
  changerAvatar: "Change your avatar",
  comptePrive: "Private account",
  prive: "🔒 Private",
  villeAgeLu: (ville: string, age: number) => `${ville}, ${age}`,
  villeAge: (ville: string, age: number) => `📍 ${ville} · ${age}`,
};

export const TEXTES_CHIFFRES_PROFIL_ANGLAIS: Traduction<typeof TEXTES_CHIFFRES_PROFIL> = {
  lieuxSauves: (nombre: number) => (nombre === 1 ? "place rescued" : "places rescued"),
  lieuxSauvesLu: (nombre: number) => `${nombre} ${nombre === 1 ? "place" : "places"} you've rescued`,
  premiers: () => "first to the rescue",
  premiersLu: (nombre: number) => `First to the rescue at ${nombre} ${nombre === 1 ? "place" : "places"}`,
  badgesLu: (obtenus: number, total: number) => `${obtenus} of ${total} badges earned`,
};

export const TEXTES_BOUEES_SEMAINE_ANGLAIS: Traduction<typeof TEXTES_BOUEES_SEMAINE> = {
  titre: "This week's lifebuoys",
  toutesDonnees: (total: number) => `You've given all ${total} of your rescues this week – well done! They top up on Monday.`,
  toutesLa: (total: number) => `Your ${total} rescues are waiting for you this week. Give them to the places that catch your eye, from your feed or their page.`,
  reste: (disponibles: number) => `You've got ${disponibles} rescue${disponibles === 1 ? "" : "s"} left this week. All topped up on Monday!`,
  compte: (disponibles: number, total: number) => `${disponibles} of ${total} rescues still to give`,
};

export const TEXTES_COLLECTIONS_PROFIL_ANGLAIS: Traduction<typeof TEXTES_COLLECTIONS_PROFIL> = {
  publicationAimeeLu: (nom: string, quartierVille: string) => `Liked post from ${nom}, ${quartierVille}`,
  gardes: "Saved",
  jaimes: "Likes",
  videGardes: "Tap 🔖 in your feed to save a place. Your future hungry self will thank you.",
  videGardesLu: "Tap “Save” on a post in your feed to save a place. Your future hungry self will thank you.",
  videJaimes: "Double-tap a video to like it – your favourites will be waiting for you here.",
  videJaimesLu: "Tap “Like” on a post in your feed – your favourites will be waiting for you here.",
  ongletLu: (nom: string, nombre: number, position: number, total: number) => `${nom}, ${nombre}, tab ${position} of ${total}`,
  indiceVignette: "Opens the place's page",
};

export const TEXTES_ENTREE_SUIVIS_ANGLAIS: Traduction<typeof TEXTES_ENTREE_SUIVIS> = {
  personnes: (nombre: number) => `${nombre} ${nombre === 1 ? "person" : "people"}`,
  lieux: (nombre: number) => `${nombre} place${nombre === 1 ? "" : "s"}`,
  createurs: (nombre: number) => `${nombre} creator${nombre === 1 ? "" : "s"}`,
};

export const TEXTES_ECRAN_SUIVIS_ANGLAIS: Traduction<typeof TEXTES_ECRAN_SUIVIS> = {
  retour: "Back",
  titre: "You follow",
  intro: "Places and creators go to the top of your feed, and lists from people you follow are waiting for you in Community. Changed your mind? Tap “Following” – no one will take offence.",
};

export const TEXTES_ANNONCE_PROFIL_ANGLAIS: Traduction<typeof TEXTES_ANNONCE_PROFIL> = {
  indiceDecisions: "Opens the moderation decisions",
  indicePseudo: "Opens your details so you can pick a username",
  indiceRanger: "Puts this notice away for good",
};

export const TEXTES_BADGES_ONGLET_PROFIL_ANGLAIS: Traduction<typeof TEXTES_BADGES_ONGLET_PROFIL> = {
  compteurLu: (obtenus: number, total: number) => `${obtenus} of ${total}`,
  obtenu: "earned",
  aDebloquer: "locked",
};
