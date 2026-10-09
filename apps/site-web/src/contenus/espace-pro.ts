// Textes de l'espace pro (https://pro.sosmiam.fr) : ce qu'il apporte dès maintenant, et ce qui arrive avec l'app.
// Source : docs/decisions.md, « Espace pro » (première et deuxième version) et « Modèle économique » (tout est gratuit).

export type AtoutPro = { emoji: string; titre: string; texte: string };

/** Première version : ce que l'espace fait aujourd'hui. */
export const atoutsPro: AtoutPro[] = [
  { emoji: "🪪", titre: "Ta fiche, à jour", texte: "Horaires, présentation, contact : tu changes, c'est en ligne tout de suite. Et ton lieu gagne le badge Vérifié ✓." },
  { emoji: "🧭", titre: "Tes infos pratiques", texte: "Animaux, terrasse, accès en fauteuil, Wi-Fi, paiements, réservation : les gourmands savent à quoi s'attendre." },
  { emoji: "💬", titre: "Les suggestions des clients", texte: "Un client repère une erreur sur ta fiche ? Tu vois ce qu'il propose, et ce que l'équipe en a fait." },
  { emoji: "🧑‍🍳", titre: "Ton équipe", texte: "Invite tes collègues : ils voient la fiche sans pouvoir tout chambouler." },
  { emoji: "🖨️", titre: "Ton affichette de table", texte: "Un QR vers ta fiche, à imprimer et poser sur les tables ou le comptoir." },
];

/** Deuxième version, avec l'app : annoncé « bientôt », sans date. */
export const bientotPro: AtoutPro[] = [
  { emoji: "📱", titre: "Le QR du comptoir", texte: "Tes clients valident leur visite en un scan." },
  { emoji: "🛟", titre: "Le SOS « place ce soir »", texte: "Une table vide ce soir ? Préviens les gourmands du coin." },
  { emoji: "📊", titre: "Tes statistiques", texte: "Vues de ta fiche, rescousses, visites validées." },
  { emoji: "⭐", titre: "Tes avis", texte: "Lis les avis vérifiés et réponds-y." },
];

/** Les trois étapes pour commencer. */
export const etapesPro = [
  "Crée ton compte SOS Miam (2 minutes).",
  "Cherche ton lieu et dis-nous que c'est le tien.",
  "L'équipe vérifie, et ta fiche est à toi.",
];
