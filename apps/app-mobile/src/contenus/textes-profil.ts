import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import type { StatutAmbassadeur } from "@sos-miam/commun/types/roles";

export const TEXTES_PROFIL = {
  modifier: "Modifier mon profil",
  indiceModifier: "Ton avatar, tes infos, tes envies",
  voirMoins: "Voir moins",
} as const;

export const TEXTES_ESPACES = {
  titre: "Tes espaces",
  pro: "Mode pro",
  plusieursLieux: (nombre: number, nom: string) => `${nombre} lieux · ${nom}`,
  indicePro: "Ouvre le comptoir de ton lieu",
  ambassadeur: "Mode ambassadeur",
  indiceAmbassadeur: "Ouvre ton espace ambassadeur",
} as const;

export const DETAILS_MODE_AMBASSADEUR: Readonly<Record<StatutAmbassadeur, string>> = {
  actif: "Avis à relire, missions et messages",
  "en-attente": "Candidature en cours",
  suspendu: "Rôle en pause",
  refuse: "Pas cette fois",
};

export const TEXTES_RACCOURCIS = {
  pasDeTable: "Réserve depuis la fiche d'une pépite",
  rienDePrevu: "Rien de prévu : une pépite te tente ?",
  fidelite: "Cartes de fidélité",
  indiceFidelite: "Ouvre tes cartes de fidélité",
  fideliteEnLecture: "Tes tampons et tes cadeaux",
  pasDeCarte: "Un tampon à chaque visite validée",
  cartes: (nombre: number) => `${nombre} carte${nombre > 1 ? "s" : ""}`,
  cadeaux: (nombre: number) => (nombre > 1 ? `${nombre} cadeaux t'attendent 🎁` : "1 cadeau t'attend 🎁"),
  suivis: "Tu suis",
  indiceSuivis: "Ouvre la liste des personnes, lieux et créateurs que tu suis",
  suivisEnLecture: "Des Miamis, des lieux et des créateurs",
  personne: "Personne : touche « Suivre »",
  visites: "Mes visites",
  indiceVisites: "Ouvre la liste de tes visites",
  visitesEnLecture: "Tes visites et tes avis à écrire",
  visitesValidees: (nombre: number) => `${nombre} validée${nombre > 1 ? "s" : ""}`,
  avisAEcrire: (nombre: number) => `${nombre} avis à écrire`,
  additionEnAttente: "Une addition en attente",
  pasDeVisite: "Scanne le QR d'un comptoir",
} as const;

export const TEXTES_PALIER = {
  titre: "Ton palier Ambassadeur",
  sousTitre: "Tes points, tes chiffres et tes bouées de la semaine",
  points: (nombre: number) => `${nombre} point${nombre > 1 ? "s" : ""}`,
  rescousses: (nombre: number) => (nombre > 0 ? `${nombre} rescousse${nombre > 1 ? "s" : ""} à donner` : "rescousses toutes données"),
  plusQue: (reste: number, palier: string) => `Plus que ${reste} point${reste > 1 ? "s" : ""} avant ${palier}`,
  nommeParLEquipe: (palier: string) => `Prochaine étape : ${palier}, nommé par l'équipe parmi les fondateurs de ta ville`,
  toutEnHaut: "Tu es tout en haut. Chapeau bas, la ville te doit une fière chandelle !",
  vers: (emoji: string, palier: string) => `Vers ${emoji} ${palier}`,
  versLu: (palier: string) => `Vers ${palier}`,
  avancee: (fait: number, objectif: number) => `${fait} / ${objectif}`,
  avanceeLue: (fait: number, objectif: number) => `${fait} points sur ${objectif}`,
  palierRempli: "Palier rempli",
  commentGagner: "Comment gagner des points ?",
  indiceCommentGagner: "Ouvre l'explication des points",
  introPoints: "Tout ce que tu fais pour les lieux du coin te rapporte des points :",
  bareme: [
    { emoji: "🧾", action: "Une visite validée", gain: `+${POINTS_AMBASSADEUR.visite} points, et même +${POINTS_AMBASSADEUR.visiteSos} pendant un SOS` },
    { emoji: "📸", action: "Un avis vérifié avec une photo de ton assiette", gain: `+${POINTS_AMBASSADEUR.avisPhoto} points` },
    { emoji: "🔎", action: "Un lieu que tu proposes et qui rejoint SOS Miam", gain: `+${POINTS_AMBASSADEUR.proposerLieu} points` },
    { emoji: "🚀", action: "La toute première rescousse d'un lieu qui vient d'arriver", gain: `+${POINTS_AMBASSADEUR.premierSauveteur} points` },
    { emoji: "🛟", action: "Chaque rescousse", gain: `+${POINTS_AMBASSADEUR.rescousse} points` },
    { emoji: "🎯", action: "Un défi réussi", gain: "les points qu'il annonce" },
  ],
  repasOffert: "Un repas offert par le lieu ne rapporte pas de points, photo comprise : le cadeau, c'est déjà l'assiette !",
  compris: "Compris",
} as const;

export const TEXTES_DEFIS_PROFIL = {
  voirAutres: (nombre: number) => (nombre === 1 ? "Voir l'autre défi" : `Voir les ${nombre} autres défis`),
  voirMoinsLu: "Voir moins de défis",
} as const;

export const TEXTES_BADGES_PROFIL = {
  titre: "Tes badges",
  derniers: (nombre: number) => (nombre === 1 ? "Ton tout premier" : `Tes ${nombre} derniers`),
  apercuLu: (nombre: number, noms: string) => (nombre === 1 ? `Ton tout premier badge : ${noms}` : `Tes ${nombre} derniers badges : ${noms}`),
  encore: (nombre: number) => `Encore ${nombre} à débloquer : la chasse est ouverte !`,
  complete: "Collection complète : la Brigade en reste bouche bée !",
  dernier: (emoji: string, nom: string) => `Le dernier : ${emoji} ${nom}`,
  aucun: "Ton premier badge t'attend : une rescousse suffit !",
  voirTout: "Voir tous tes badges",
  indiceVoirTout: "Ouvre tous tes badges, rangés par familles",
} as const;

export const TEXTES_COLLECTION = {
  titre: "Ta collection",
  sousTitre: "Tes lieux gardés et tes coups de cœur",
  compte: (gardes: number, jaimes: number) => `${gardes} gardé${gardes > 1 ? "s" : ""} · ${jaimes} J'aime`,
  vide: "Rien de gardé pour l'instant : le fil regorge de pépites",
  dernierGarde: (nom: string) => `Le dernier gardé : ${nom}`,
  voirGardes: (nombre: number) => `Voir tes ${nombre} lieux gardés`,
  voirJaimes: (nombre: number) => `Voir tes ${nombre} J'aime`,
  voirMoinsGardesLu: "Voir moins de lieux gardés",
  voirMoinsJaimesLu: "Voir moins de J'aime",
} as const;
