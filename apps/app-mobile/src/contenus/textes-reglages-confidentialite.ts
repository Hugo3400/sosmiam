import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_CONFIDENTIALITE_ANGLAIS } from "~/contenus/anglais/textes-reglages-confidentialite";

export const TEXTES_REGLAGES_CONFIDENTIALITE = {
  annoncePrive: "🔒 Ton compte est privé. Tes abonnés restent ; les prochains devront frapper à la porte.",
  annoncePublic: "🔓 Ton compte est public : tout le monde peut te suivre sans demander.",
  annonceRatee: "Ça n'a pas marché cette fois : ton compte n'a pas changé. Réessaie dans un instant.",
  demandes: (nombre: number) => (nombre > 1 ? `Les ${nombre} demandes en attente seront acceptées.` : "La demande en attente sera acceptée."),
  publicAvecDemandes: (acceptees: number) =>
    `🔓 Ton compte est public. ${acceptees > 1 ? `${acceptees} demandes acceptées` : "1 demande acceptée"} : bienvenue à tes nouveaux abonnés !`,
  titreAvecBande: "Confidentialité",
  titreSansBande: "Compte privé",
  sousTitreAvecBande: "Qui peut te suivre, qui peut te trouver, et ce que voit ta bande.",
  sousTitreSansBande: "Qui peut te suivre, et ce que voient ceux qui ne te suivent pas.",
  chargement: "Chargement de tes réglages",
  comptePrive: "Compte privé",
  comptePriveDetail: "Chaque nouvel abonné devra te demander",
  explicationCompte:
    "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tes listes et tes badges, et ta bande voit tout.",
  explicationTelephone:
    "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tout, et ta bande aussi, si vous vous êtes ajoutés en vrai (lien ou QR code).",
  passerPrive: "Passer en privé ne met personne dehors : tes abonnés restent. Et si tu repasses en public, les demandes en attente seront acceptées.",
  feuilleTitre: "Passer ton compte en public ?",
  feuilleDetail: (demandes: string) => `Tout le monde pourra te suivre sans demander. ${demandes}`,
  passerPublic: "Passer en public",
  resterPrive: "Je reste en privé",
  resterPriveIndice: "Ton compte reste privé, les demandes attendent",
  bande: {
    titre: "Ta bande",
    intro: "Qui peut te trouver, et ce que tes potes voient de toi.",
    chargement: "Chargement des réglages de ta bande",
    interrupteurs: {
      trouvable: { titre: "Qu'on me trouve par mon pseudo", detail: "Éteint, on n'entre dans ta bande que par ton lien ou ton QR code." },
      suggerable: { titre: "Me proposer à d'autres", detail: "On peut te suggérer aux potes de tes potes." },
      activitePartagee: {
        titre: "Montrer mon activité à ma bande",
        detail: "Tes rescousses, tes lieux gardés et tes badges, dans Quoi de neuf et le classement.",
      },
      pushSocial: {
        titre: "Notifications de ma bande",
        detail:
          "Messages, sorties et nouveaux potes, sur ton téléphone. Éteint, rien de ta bande n'y arrive, messages compris : tu retrouves tout en ouvrant l'app. Seule exception : un pote qui te prévient avec Miam Safe, ça passe toujours.",
      },
    },
  },
} as const;

export const TEXTES_REGLAGES_CONFIDENTIALITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_CONFIDENTIALITE>> = {
  fr: TEXTES_REGLAGES_CONFIDENTIALITE,
  en: TEXTES_REGLAGES_CONFIDENTIALITE_ANGLAIS,
};
