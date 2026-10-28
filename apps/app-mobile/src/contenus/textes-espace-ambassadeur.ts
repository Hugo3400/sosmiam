import type { StatutAmbassadeur } from "@sos-miam/commun/types/roles";
import type { VerdictRelecture } from "@sos-miam/commun/types/avis";
import type { TypeMission } from "@sos-miam/commun/types/espace-ambassadeur";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  STATUTS_CARTE_AMBASSADEUR_ANGLAIS,
  TEXTES_AVIS_A_RELIRE_ANGLAIS,
  TEXTES_ECRAN_ESPACE_AMBASSADEUR_ANGLAIS,
  TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS,
  TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS,
  TEXTES_MOTIF_LOUCHE_ANGLAIS,
  TEXTES_ONGLETS_AMBASSADEUR_ANGLAIS,
  TEXTES_RELECTURES_ANGLAIS,
  TYPES_MISSION_ANGLAIS,
} from "~/contenus/anglais/textes-espace-ambassadeur";

export const TEXTES_ONGLETS_AMBASSADEUR = {
  ongletLu: (nom: string, position: number, total: number) => `${nom}, onglet ${position} sur ${total}`,
  espace: "Espace",
  missions: "Missions",
  relectures: "Relectures",
  messages: "Messages",
} as const;

export const TEXTES_ECRAN_ESPACE_AMBASSADEUR = {
  titre: "Espace",
  sousTitre: "La Brigade veille sur les lieux du coin",
  missionsAFaire: (nombre: number) => (nombre > 1 ? "missions à faire" : "mission à faire"),
  avisARelire: (nombre: number) => (nombre > 1 ? "avis à relire" : "avis à relire"),
  messagesNonLus: (nombre: number) => (nombre > 1 ? "messages non lus" : "message non lu"),
  ouverture: "On ouvre ton espace…",
  siteTitre: "Tout ton espace sur le site",
  siteDetail: "Fondateurs de ville, propositions de lieux, ambassadeur certifié : sur ambassadeur.sosmiam.fr",
  palier: "Ton palier et tes points sont sur ton profil, comme d'habitude.",
} as const;

export const TEXTES_MESSAGES_AMBASSADEUR = {
  titre: "Messages",
  sousTitre: "Les nouvelles de l'équipe SOS Miam",
  vide: "Pas encore de message : l'équipe t'écrira ici.",
  nonLu: "Non lu : ",
} as const;

export const TEXTES_MISSIONS_AMBASSADEUR = {
  titre: "Missions",
  sousTitre: "Ce que l'équipe te confie, près de chez toi",
  aFaire: (nombre: number) => `À faire${nombre ? ` (${nombre})` : ""}`,
  rien: "Rien pour l'instant : profite, l'équipe te fait signe dès qu'un lieu a besoin de toi.",
  faites: "Faites",
  faiteLe: (jour: string) => `Faite le ${jour.toLowerCase()}`,
  annulee: "Annulée",
  avantLe: (jour: string) => `Avant le ${jour.toLowerCase()}`,
  sansDate: "Sans date limite",
  carteLu: (type: string, titre: string, ou: string | null, quand: string) => `${type} : ${titre}${ou ? `, ${ou}` : ""}. ${quand}`,
} as const;

export const TYPES_MISSION: Readonly<Record<TypeMission, { emoji: string; nom: string }>> = {
  "verifier-lieu": { emoji: "🔎", nom: "Vérifier un lieu" },
  "verifier-big-sos": { emoji: "🆘", nom: "Vérifier un BIG SOS" },
  "controler-lieu": { emoji: "🧐", nom: "Passer voir un lieu" },
  autre: { emoji: "🧭", nom: "Mission" },
};

export const TEXTES_RELECTURES = {
  merci: { ok: "Merci ! Avis relu.", louche: "Merci ! L'équipe y jette un œil.", deporte: "C'est noté : un autre ambassadeur le relira." } satisfies Record<VerdictRelecture["type"], string>,
  dejaRelu: "Trois ambassadeurs l'ont déjà relu pendant ce temps : merci quand même !",
  titre: "Relectures",
  sousTitre: "Ton avis compte, l'équipe tranche",
  vide: "Aucun avis à relire : tout est nickel. Reviens plus tard, on t'en garde au chaud.",
} as const;

export const TEXTES_AVIS_A_RELIRE = {
  photoLu: "Photo de l'avis",
  ok: "Ça me va",
  louche: "Ça me paraît louche",
  passer: "Je passe mon tour",
  indicePasser: "Si tu connais ce lieu ou la personne : un autre ambassadeur le relira",
} as const;

export const TEXTES_MOTIF_LOUCHE = {
  titre: "Qu'est-ce qui cloche ?",
  sousTitre: "Ton avis aide l'équipe, qui a toujours le dernier mot. On ne masque jamais un avis tout seul.",
  envoyer: "Envoyer à l'équipe",
} as const;

export const STATUTS_CARTE_AMBASSADEUR: Readonly<Record<StatutAmbassadeur, { emoji: string; titre: string; texte: string }>> = {
  actif: { emoji: "🤝", titre: "Ambassadeur actif", texte: "Merci de veiller sur les lieux du coin ! Tes missions, les avis à relire et les messages de l'équipe sont ici." },
  "en-attente": { emoji: "⏳", titre: "Candidature en cours", texte: "L'équipe relit ta candidature. On te prévient dès que c'est bon : garde ton plus beau tablier à portée de main." },
  refuse: { emoji: "🙏", titre: "Pas cette fois", texte: "Ta candidature n'a pas été retenue pour l'instant. Continue de sauver des tables : la porte reste ouverte." },
  suspendu: { emoji: "⏸️", titre: "Rôle en pause", texte: "Ton rôle d'ambassadeur est en pause. Un message de l'équipe t'explique pourquoi sur ambassadeur.sosmiam.fr." },
};

export const TEXTES_ONGLETS_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLETS_AMBASSADEUR>> = { fr: TEXTES_ONGLETS_AMBASSADEUR, en: TEXTES_ONGLETS_AMBASSADEUR_ANGLAIS };
export const TEXTES_ECRAN_ESPACE_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_ESPACE_AMBASSADEUR>> = { fr: TEXTES_ECRAN_ESPACE_AMBASSADEUR, en: TEXTES_ECRAN_ESPACE_AMBASSADEUR_ANGLAIS };
export const TEXTES_MESSAGES_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MESSAGES_AMBASSADEUR>> = { fr: TEXTES_MESSAGES_AMBASSADEUR, en: TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS };
export const TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MISSIONS_AMBASSADEUR>> = { fr: TEXTES_MISSIONS_AMBASSADEUR, en: TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS };
export const TYPES_MISSION_PAR_LANGUE: ParLangue<Traduction<typeof TYPES_MISSION>> = { fr: TYPES_MISSION, en: TYPES_MISSION_ANGLAIS };
export const TEXTES_RELECTURES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RELECTURES>> = { fr: TEXTES_RELECTURES, en: TEXTES_RELECTURES_ANGLAIS };
export const TEXTES_AVIS_A_RELIRE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AVIS_A_RELIRE>> = { fr: TEXTES_AVIS_A_RELIRE, en: TEXTES_AVIS_A_RELIRE_ANGLAIS };
export const TEXTES_MOTIF_LOUCHE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MOTIF_LOUCHE>> = { fr: TEXTES_MOTIF_LOUCHE, en: TEXTES_MOTIF_LOUCHE_ANGLAIS };
export const STATUTS_CARTE_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof STATUTS_CARTE_AMBASSADEUR>> = { fr: STATUTS_CARTE_AMBASSADEUR, en: STATUTS_CARTE_AMBASSADEUR_ANGLAIS };
