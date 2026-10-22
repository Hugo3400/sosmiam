export type PointNouveaute = {
  emoji: string;
  titre: string;
  detail: string;
};

export type NouveautesVersion = {
  version: string;
  libelle: string;
  date: string | null;
  titre: string;
  points: readonly PointNouveaute[];
};

export const NOUVEAUTES_VERSIONS: readonly NouveautesVersion[] = [
  {
    version: "1.0.2",
    libelle: "1.0.2",
    date: null,
    titre: "Ta messagerie fait peau neuve",
    points: [
      { emoji: "💬", titre: "Les messages ont leur onglet", detail: "En premier dans Communauté, avec les non-lus sur l'onglet du bas." },
      { emoji: "↩️", titre: "Répondre, modifier, le « Vu »", detail: "Et l'heure qui dit « il y a 5 min »." },
      { emoji: "🍝", titre: "« On mange où ? »", detail: "Un sondage de lieux dans tes groupes." },
      { emoji: "📸", titre: "Plusieurs photos avec un petit mot", detail: "Jusqu'à 10 d'un coup." },
      { emoji: "🎙️", titre: "Le micro qui bouge", detail: "Tu vois ta voix pendant la note vocale." },
      { emoji: "⏰", titre: "Le rappel de sortie", detail: "En haut de la discussion, et 1 h avant." },
    ],
  },
  {
    version: "1.0.1",
    libelle: "1.0.1",
    date: "22 octobre 2026",
    titre: "Bonsoir le mode sombre",
    points: [
      { emoji: "🌙", titre: "Le mode sombre", detail: "Dans Paramètres › Apparence, ou comme ton téléphone." },
      { emoji: "📷", titre: "Des photos plus légères", detail: "Jusqu'à 5 Mo, allégées pour toi avant l'envoi." },
      { emoji: "🐞", titre: "Chasse aux bugs et On recrute", detail: "Dans Paramètres › La vie de SOS Miam." },
      { emoji: "⚡", titre: "Un fil plus rapide", detail: "La suite se charge pendant que tu regardes." },
    ],
  },
  {
    version: "1.0.0",
    libelle: "1.0",
    date: null,
    titre: "Bienvenue à bord",
    points: [
      { emoji: "🛟", titre: "La toute première", detail: "Les SOS du soir, les rescousses, les visites validées, les cartes de fidélité et ta bande." },
    ],
  },
];
