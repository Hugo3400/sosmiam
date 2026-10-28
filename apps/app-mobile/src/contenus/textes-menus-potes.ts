import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MENUS_POTES_ANGLAIS } from "~/contenus/anglais/textes-menus-potes";

export const TEXTES_MENUS_POTES = {
  recommandation: {
    titre: (prenom: string) => `Lieu envoyé par ${prenom}`,
    signaler: "Signaler ce lieu envoyé",
    detail: "Pub déguisée, arnaque, mot qui blesse… il disparaît pour toi",
    sujet: (prenom: string) => `le lieu envoyé par ${prenom}`,
  },
  liste: {
    titre: (prenom: string) => `Liste de ${prenom}`,
    signaler: "Signaler cette liste",
    detail: "Titre choquant, arnaque, pub déguisée… elle disparaît pour toi",
    sujet: (prenom: string) => `la liste de ${prenom}`,
  },
  contenu: {
    voirProfil: (prenom: string) => `Voir le profil de ${prenom}`,
    signalerProfil: (prenom: string) => `Signaler ${prenom}`,
    signalerProfilDetail: "Son profil pose problème ? On regarde ça de près",
    bloquerDetail: "Ses messages, ses lieux envoyés et ses listes disparaissent pour toi",
    sujetProfil: (prenom: string) => `le profil de ${prenom}`,
    bloquerDansBande: (prenom: string) => `${prenom} sortira de ta bande, et tu ne verras plus ses messages, ses commentaires, ses lieux envoyés ni ses listes.`,
    bloquerHorsBande: "Tu ne verras plus ses messages, ses commentaires, ses lieux envoyés ni ses listes. Tu restes tranquille, c'est tout ce qui compte.",
  },
  message: {
    cettePersonne: "cette personne",
    signaler: "Signaler ce message",
    signalerDetail: "Insulte, harcèlement, arnaque… dis-nous ce qui cloche",
    bloquerDetail: "Tu ne verras plus ses messages ni ses commentaires",
    sujet: (prenom: string) => `ce message de ${prenom}`,
    bloquerDansBande: (prenom: string) => `${prenom} sortira de ta bande, et ses messages et ses commentaires disparaîtront pour toi. Tu restes tranquille, c'est tout ce qui compte.`,
    bloquerHorsBande: "Ses messages et ses commentaires disparaîtront pour toi. Tu restes tranquille, c'est tout ce qui compte.",
    titre: (prenom: string) => `Message de ${prenom}`,
  },
  bloquer: (prenom: string) => `Bloquer ${prenom}`,
  bloquerTitre: (prenom: string) => `Bloquer ${prenom} ?`,
  nonJeReviens: "Non, je reviens",
  fermerMenu: "Fermer le menu",
  annuler: "Annuler",
};

export const TEXTES_MENUS_POTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MENUS_POTES>> = { fr: TEXTES_MENUS_POTES, en: TEXTES_MENUS_POTES_ANGLAIS };
