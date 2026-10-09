// Le lieu joué par le mode pro de la démo : le restaurant imaginaire de Capitaine Bouiboui, la mascotte du kit de marque
// (kits/SOS_Miam_kit_de_marque). Un nom inventé de toutes pièces, pour ne jamais faire jouer l'équipe d'un vrai lieu.
// Ses additions, son QR du comptoir, sa carte de fidélité et ses réservations d'exemple sont dans visites-exemples.ts.
import type { Lieu } from "@sos-miam/commun/types/lieu";

export const LIEU_DEMO_PRO_ID = 18;

export const lieuDemoPro: Lieu = {
  id: LIEU_DEMO_PRO_ID,
  nom: "Restaurant du Capitaine Bouiboui",
  type: "resto",
  emoji: "🛟",
  quartier: "Port Marianne",
  ville: "Montpellier",
  position: { latitude: 43.6008, longitude: 3.8972 },
  km: 2.1,
  prix: "€€",
  prixMoyen: 20,
  info: "Cuisine de bord",
  couleurs: ["#FFD60A", "#FF4D3D"],
  texte: "Le restaurant imaginaire de Capitaine Bouiboui, la mascotte de SOS Miam : c'est ici qu'on essaie le mode pro de la démo. Moules du port, pêche du jour et île flottante, servis par la Brigade.",
  rescousses: 42,
  horaires: "12h–14h30 · 19h–23h",
  ouverture: [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "12:00", a: "14:30" }, { jours: [0, 1, 2, 3, 4, 5, 6], de: "19:00", a: "23:00" }],
  plat: "Moules du Capitaine · 14 €",
  tags: ["Fait maison", "Pêche du jour", "Terrasse"],
  envies: ["potes", "famille", "terrasse"],
  reservable: true,
};
