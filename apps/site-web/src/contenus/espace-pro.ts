// Textes de l'espace pro (https://pro.sosmiam.fr) : ce qu'il apporte dès maintenant, et ce qui arrive avec l'app.
// Source : docs/decisions.md, « Espace pro » (première et deuxième version) et « Modèle économique » (tout est gratuit).
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_ESPACE_PRO_ANGLAIS } from "~/contenus/anglais/espace-pro";

export type AtoutPro = { emoji: string; titre: string; texte: string };

export const EMOJIS_ATOUTS_PRO = ["🪪", "🧭", "💬", "🧑‍🍳", "🖨️"] as const;

export const EMOJIS_BIENTOT_PRO = ["📱", "🛟", "📊", "⭐"] as const;

export const TEXTES_ESPACE_PRO = {
  meta: {
    titre: "L'espace pro",
    description: "SOS Miam pro : ta fiche à jour, tes infos pratiques, les suggestions des clients, ton équipe et ton affichette. Gratuit, sans abonnement ni commission.",
  },
  boutons: {
    tableau: "Aller à mon tableau",
    creerCompte: "Créer mon compte",
    connexion: "Me connecter",
    pasSurSosMiam: "Mon lieu n'est pas sur SOS Miam",
  },
  badge: "Pour les restos, bars et pâtisseries (et les sorties aussi)",
  titre: "Ton lieu, ta fiche, tes gourmands.",
  chapo: "L'espace pro de SOS Miam, c'est là où tu tiens ta fiche à jour, où tu vois ce que les clients te suggèrent et où tu invites ton équipe. Le tout sans payer un centime.",
  inscrireEn3Minutes: " : inscris-le en 3 minutes.",
  gratuit: {
    pourToujours: "Pour toujours",
    titre: "C'est gratuit",
    sans: ["Sans abonnement", "Sans engagement", "Sans commission"],
    pub: "SOS Miam vit de la pub, toujours signalée, qui ne change jamais le classement.",
  },
  aujourdhui: "Ce que tu peux faire dès aujourd'hui",
  bientot: {
    titre: "Et bientôt, avec l'app",
    texte: "Ça arrive avec l'app SOS Miam. On te prévient dès que c'est prêt.",
    pastille: "Bientôt",
  },
  commentCaMarche: "Comment ça marche ?",
  atouts: [
    { titre: "Ta fiche, à jour", texte: "Horaires, présentation, contact : tu changes, c'est en ligne tout de suite. Et ton lieu gagne le badge Vérifié ✓." },
    { titre: "Tes infos pratiques", texte: "Animaux, terrasse, accès en fauteuil, Wi-Fi, paiements, réservation : les gourmands savent à quoi s'attendre." },
    { titre: "Les suggestions des clients", texte: "Un client repère une erreur sur ta fiche ? Tu vois ce qu'il propose, et ce que l'équipe en a fait." },
    { titre: "Ton équipe", texte: "Invite tes collègues : ils voient la fiche sans pouvoir tout chambouler." },
    { titre: "Ton affichette de table", texte: "Un QR vers ta fiche, à imprimer et poser sur les tables ou le comptoir." },
  ],
  avecLApp: [
    { titre: "Le QR du comptoir", texte: "Tes clients valident leur visite en un scan." },
    { titre: "Le SOS « place ce soir »", texte: "Une table vide ce soir ? Préviens les gourmands du coin." },
    { titre: "Tes statistiques", texte: "Vues de ta fiche, rescousses, visites validées." },
    { titre: "Tes avis", texte: "Lis les avis vérifiés et réponds-y." },
  ],
  etapes: [
    "Crée ton compte SOS Miam (2 minutes).",
    "Cherche ton lieu et dis-nous que c'est le tien.",
    "L'équipe vérifie, et ta fiche est à toi.",
  ],
};

export const TEXTES_ESPACE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ESPACE_PRO>> = {
  fr: TEXTES_ESPACE_PRO,
  en: TEXTES_ESPACE_PRO_ANGLAIS,
};
