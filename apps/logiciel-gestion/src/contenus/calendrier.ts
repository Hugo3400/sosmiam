// Les types d'événements du calendrier : leur nom, leur couleur et l'écran qu'ils ouvrent.
import type { Ecran } from "~/contenus/menu.ts";
import type { TypeEvenement } from "~/services/calendrier.ts";

export const EVENEMENTS: Record<TypeEvenement, { libelle: string; emoji: string; classes: string; ecran: Ecran; avecId: boolean }> = {
  publication: { libelle: "Publication", emoji: "🎬", classes: "bg-jaune-clair text-encre", ecran: "publications", avecId: true },
  notification: { libelle: "Notification", emoji: "🔔", classes: "bg-ligne text-encre", ecran: "notifications", avecId: false },
  "big-sos": { libelle: "BIG SOS à la une", emoji: "🛟", classes: "bg-tomate text-white", ecran: "big-sos", avecId: true },
  mission: { libelle: "Échéance de mission", emoji: "🎯", classes: "bg-vert-clair text-vert", ecran: "ambassadeurs", avecId: true },
  newsletter: { libelle: "Newsletter envoyée", emoji: "💌", classes: "bg-encre text-jaune", ecran: "newsletter", avecId: false },
  annonce: { libelle: "Annonce Discord", emoji: "📣", classes: "bg-rose-alerte text-rouge-texte", ecran: "annonces", avecId: false },
};
