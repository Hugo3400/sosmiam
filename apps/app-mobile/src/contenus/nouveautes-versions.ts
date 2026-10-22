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
      { emoji: "💬", titre: "Les messages ont leur onglet", detail: "En premier dans Communauté, avec une pastille pour les non-lus." },
      { emoji: "↩️", titre: "Répondre, modifier, copier, le « Vu »", detail: "Glisse une bulle pour lui répondre, et l'heure dit « il y a 5 min ». Le « Vu » se règle dans Paramètres › Messages." },
      { emoji: "🎞️", titre: "Les GIF débarquent", detail: "Cherche le GIF parfait et envoie-le à ta bande." },
      { emoji: "🍝", titre: "« On mange où ? »", detail: "Un sondage de lieux dans tes groupes, le gagnant ouvre la sortie." },
      { emoji: "🔔", titre: "Le message dans la notification", detail: "Lis-le sans ouvrir l'app, réponds-y d'un geste. Il reste chiffré jusqu'à ton téléphone." },
      { emoji: "🔴", titre: "Une pastille sur l'icône", detail: "Tes messages, invitations et notifications en un coup d'œil." },
      { emoji: "📸", titre: "Plusieurs photos avec un petit mot", detail: "Jusqu'à 10 d'un coup, et en plein écran avec le zoom." },
      { emoji: "🎙️", titre: "Le micro qui bouge", detail: "Tu vois ta voix pendant la note vocale." },
      { emoji: "📌", titre: "Épingler, chercher, brouillons", detail: "Tes discussions préférées en haut, et rien ne se perd en route." },
      { emoji: "😋", titre: "Mentions et double toucher", detail: "@ un pote pour le prévenir, touche deux fois un message pour dire miam." },
      { emoji: "👥", titre: "Les infos du groupe", detail: "Son nom, sa photo, ses membres, et tout ce qui s'y est partagé." },
      { emoji: "⏰", titre: "Le rappel de sortie", detail: "En haut de la discussion, et 1 h avant." },
      { emoji: "🎉", titre: "Les nouveautés", detail: "Cette fenêtre, et leur page dans les Paramètres." },
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
