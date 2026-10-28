import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  TEXTES_ANNONCE_PROFIL_ANGLAIS,
  TEXTES_BADGES_ONGLET_PROFIL_ANGLAIS,
  TEXTES_BOUEES_SEMAINE_ANGLAIS,
  TEXTES_CHIFFRES_PROFIL_ANGLAIS,
  TEXTES_COLLECTIONS_PROFIL_ANGLAIS,
  TEXTES_EN_TETE_PROFIL_ANGLAIS,
  TEXTES_ENTREE_SUIVIS_ANGLAIS,
  TEXTES_ECRAN_SUIVIS_ANGLAIS,
} from "~/contenus/anglais/textes-profil-onglet";

export const TEXTES_EN_TETE_PROFIL = {
  parametres: "Paramètres",
  indiceParametres: "Ton compte, tes alertes et tes données",
  changerAvatar: "Changer ton avatar",
  comptePrive: "Compte privé",
  prive: "🔒 Privé",
  villeAgeLu: (ville: string, age: number) => `${ville}, ${age} ans`,
  villeAge: (ville: string, age: number) => `📍 ${ville} · ${age} ans`,
} as const;

export const TEXTES_CHIFFRES_PROFIL = {
  lieuxSauves: (nombre: number) => (nombre > 1 ? "lieux sauvés" : "lieu sauvé"),
  lieuxSauvesLu: (nombre: number) => `${nombre} ${nombre > 1 ? "lieux sauvés" : "lieu sauvé"}`,
  premiers: (nombre: number) => (nombre > 1 ? "sauvés en premier" : "sauvé en premier"),
  premiersLu: (nombre: number) => `${nombre} ${nombre > 1 ? "lieux sauvés" : "lieu sauvé"} en premier`,
  badgesLu: (obtenus: number, total: number) => `${obtenus} badge${obtenus > 1 ? "s" : ""} obtenu${obtenus > 1 ? "s" : ""} sur ${total}`,
} as const;

export const TEXTES_BOUEES_SEMAINE = {
  titre: "Tes bouées de la semaine",
  toutesDonnees: (total: number) => `Tu as donné tes ${total} rescousses cette semaine, bravo ! Elles se rechargent lundi.`,
  toutesLa: (total: number) => `Tes ${total} rescousses t'attendent cette semaine : donne-les aux lieux qui te font de l'œil, depuis le fil ou leur fiche.`,
  reste: (disponibles: number) => `Il te reste ${disponibles} rescousse${disponibles > 1 ? "s" : ""} cette semaine. Toutes rechargées lundi !`,
  compte: (disponibles: number, total: number) => `${disponibles} rescousse${disponibles > 1 ? "s" : ""} sur ${total} encore à donner`,
} as const;

export const TEXTES_COLLECTIONS_PROFIL = {
  publicationAimeeLu: (nom: string, quartierVille: string) => `Publication aimée de ${nom}, ${quartierVille}`,
  gardes: "Gardés",
  jaimes: "J'aime",
  videGardes: "Touche 🔖 dans le fil pour garder une adresse. Ton futur toi affamé te dira merci.",
  videGardesLu: "Touche « Garder » sur une publication du fil pour garder une adresse. Ton futur toi affamé te dira merci.",
  videJaimes: "Double-touche une vidéo pour l'aimer : tes coups de cœur t'attendront ici.",
  videJaimesLu: "Touche « J'aime » sur une publication du fil : tes coups de cœur t'attendront ici.",
  ongletLu: (nom: string, nombre: number, position: number, total: number) => `${nom}, ${nombre}, onglet ${position} sur ${total}`,
  indiceVignette: "Ouvre la fiche du lieu",
} as const;

export const TEXTES_ENTREE_SUIVIS = {
  personnes: (nombre: number) => `${nombre} personne${nombre > 1 ? "s" : ""}`,
  lieux: (nombre: number) => `${nombre} lieu${nombre > 1 ? "x" : ""}`,
  createurs: (nombre: number) => `${nombre} créateur${nombre > 1 ? "s" : ""}`,
} as const;

export const TEXTES_ECRAN_SUIVIS = {
  retour: "Retour",
  titre: "Tu suis",
  intro: "Les lieux et les créateurs passent en tête de ton fil ; les listes des gens que tu suis t'attendent dans Potes. Changé d'avis ? Touche « Suivi » : personne ne se vexe.",
} as const;

export const TEXTES_ANNONCE_PROFIL = {
  indiceDecisions: "Ouvre les décisions de la modération",
  indicePseudo: "Ouvre tes infos pour choisir ton pseudo",
  indiceRanger: "Range cette annonce pour de bon",
} as const;

export const TEXTES_BADGES_ONGLET_PROFIL = {
  compteurLu: (obtenus: number, total: number) => `${obtenus} sur ${total}`,
  obtenu: "obtenu",
  aDebloquer: "à débloquer",
} as const;

export const TEXTES_EN_TETE_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_EN_TETE_PROFIL>> = { fr: TEXTES_EN_TETE_PROFIL, en: TEXTES_EN_TETE_PROFIL_ANGLAIS };
export const TEXTES_CHIFFRES_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHIFFRES_PROFIL>> = { fr: TEXTES_CHIFFRES_PROFIL, en: TEXTES_CHIFFRES_PROFIL_ANGLAIS };
export const TEXTES_BOUEES_SEMAINE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_BOUEES_SEMAINE>> = { fr: TEXTES_BOUEES_SEMAINE, en: TEXTES_BOUEES_SEMAINE_ANGLAIS };
export const TEXTES_COLLECTIONS_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COLLECTIONS_PROFIL>> = { fr: TEXTES_COLLECTIONS_PROFIL, en: TEXTES_COLLECTIONS_PROFIL_ANGLAIS };
export const TEXTES_ENTREE_SUIVIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ENTREE_SUIVIS>> = { fr: TEXTES_ENTREE_SUIVIS, en: TEXTES_ENTREE_SUIVIS_ANGLAIS };
export const TEXTES_ECRAN_SUIVIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_SUIVIS>> = { fr: TEXTES_ECRAN_SUIVIS, en: TEXTES_ECRAN_SUIVIS_ANGLAIS };
export const TEXTES_ANNONCE_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ANNONCE_PROFIL>> = { fr: TEXTES_ANNONCE_PROFIL, en: TEXTES_ANNONCE_PROFIL_ANGLAIS };
export const TEXTES_BADGES_ONGLET_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_BADGES_ONGLET_PROFIL>> = { fr: TEXTES_BADGES_ONGLET_PROFIL, en: TEXTES_BADGES_ONGLET_PROFIL_ANGLAIS };
