// Libellés des infos pratiques d'un lieu (fiche publique /lieux/:id et « Ma fiche » de l'espace pro). Mêmes codes et mêmes
// mots que packages/commun/src/contenus/libelles-infos-pratiques.ts (fiche de l'app) : les changer des deux côtés.
import type { AccueilAnimaux, FichePro, MoyenPaiement, ReservationConseillee } from "~/types/pro";

export const LIBELLES_ANIMAUX: Record<AccueilAnimaux, { emoji: string; texte: string }> = {
  bienvenus: { emoji: "🐶", texte: "Animaux bienvenus" },
  terrasse: { emoji: "🐕", texte: "Animaux en terrasse seulement" },
  non: { emoji: "🚫", texte: "Pas d'animaux" },
};

export const LIBELLES_PAIEMENT: Record<MoyenPaiement, string> = {
  cb: "carte bancaire",
  "sans-contact": "sans contact",
  especes: "espèces",
  "tickets-resto": "tickets resto",
  "cheques-vacances": "chèques-vacances",
};

export const LIBELLES_RESERVATION: Record<ReservationConseillee, string> = {
  inutile: "Pas besoin de réserver",
  conseillee: "Réservation conseillée",
  obligatoire: "Réservation obligatoire",
};

/** Les infos en oui / non : ce que dit la fiche quand c'est oui (et quand c'est non). */
export const INFOS_OUI_NON: { champ: "accessible" | "terrasse" | "wifi" | "enfants" | "parking"; emoji: string; question: string; oui: string; non: string }[] = [
  { champ: "accessible", emoji: "♿", question: "Accessible en fauteuil roulant (entrée et salle)", oui: "Accessible en fauteuil roulant", non: "Pas accessible en fauteuil roulant" },
  { champ: "terrasse", emoji: "☀️", question: "Une terrasse", oui: "Terrasse", non: "Pas de terrasse" },
  { champ: "wifi", emoji: "📶", question: "Du Wi-Fi pour les clients", oui: "Wi-Fi", non: "Pas de Wi-Fi" },
  { champ: "enfants", emoji: "🧒", question: "Une chaise haute ou un menu enfant", oui: "Chaise haute ou menu enfant", non: "Pas d'équipement pour les petits" },
  { champ: "parking", emoji: "🅿️", question: "Un parking facile juste à côté", oui: "Parking facile à côté", non: "Pas de parking facile" },
];

/** Le nom de chaque champ de la fiche, pour les suggestions (« Horaires : avant → après »). */
export const NOMS_CHAMPS: Record<keyof FichePro, string> = {
  id: "Numéro",
  nom: "Nom",
  adresse: "Adresse",
  ville: "Ville",
  categorie: "Catégorie",
  horaires: "Horaires",
  texte: "Présentation",
  telephone: "Téléphone",
  siteWeb: "Site",
  instagram: "Instagram",
  animaux: "Animaux",
  accessible: "Accès en fauteuil",
  terrasse: "Terrasse",
  wifi: "Wi-Fi",
  enfants: "Chaise haute ou menu enfant",
  parking: "Parking",
  paiements: "Paiements",
  reservation: "Réservation",
  estVerifie: "Vérifié",
};
