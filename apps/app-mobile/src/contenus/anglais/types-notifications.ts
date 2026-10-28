import type { ChoixTypeNotification } from "~/contenus/types-notifications";

export const TYPES_NOTIFICATIONS_ANGLAIS: ChoixTypeNotification[] = [
  { type: "sos", emoji: "🛟", titre: "SOS near you", detail: "A place would love a few more faces tonight", groupe: "lieux" },
  { type: "calme", emoji: "😌", titre: "Quiet room, free tables", detail: "A peaceful place has room for you", groupe: "lieux" },
  {
    type: "offre",
    emoji: "🎁",
    titre: "Offers and deals",
    detail: "By turning this on, you agree to receive promotional notifications from places: offers and deals. You can turn it off whenever you like.",
    groupe: "lieux",
  },
  { type: "evenement", emoji: "🎉", titre: "Events", detail: "Live music, quizzes, themed nights – plenty going on", groupe: "lieux" },
  { type: "nouveau", emoji: "✨", titre: "New places", detail: "A place has just joined SOS Miam", groupe: "lieux" },
  { type: "abonne", emoji: "👋", titre: "New followers", detail: "Someone's started following you", groupe: "abonnements" },
  { type: "demande", emoji: "📨", titre: "Follow requests", detail: "Someone wants to follow you", groupe: "abonnements" },
  { type: "publication-suivie", emoji: "🎬", titre: "New from accounts you follow", detail: "A place or creator you follow has posted something", groupe: "abonnements" },
];
