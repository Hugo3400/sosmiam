// Noms des champs d'une fiche de lieu, pour les modifications proposées (dans l'ordre de la fiche).
export const LIBELLES_CHAMPS_LIEU: Record<string, string> = {
  nom: "Nom", type: "Type", info: "Ce que c'est", texte: "Présentation", adresse: "Adresse", quartier: "Quartier", ville: "Ville",
  latitude: "Latitude", longitude: "Longitude", prix: "Prix", prixMoyen: "Prix moyen", horaires: "Horaires",
  ouverture: "Créneaux d'ouverture", plat: "Plat signature", tags: "Mots-clés", envies: "Envies", reservable: "Réservable",
  telephone: "Téléphone", siteWeb: "Site web", instagram: "Instagram",
  animaux: "Animaux", accessible: "Accessible en fauteuil", terrasse: "Terrasse", wifi: "Wifi", enfants: "Enfants (chaise haute, menu)",
  parking: "Parking facile", paiements: "Paiements", reservation: "Réservation",
};

/** Valeurs des infos pratiques, en clair (mêmes valeurs que packages/commun/src/types/infos-pratiques.ts) */
export const VALEURS_INFOS_PRATIQUES: Record<string, Record<string, string>> = {
  animaux: { bienvenus: "Bienvenus", terrasse: "En terrasse seulement", non: "Pas d'animaux" },
  paiements: { cb: "CB", "sans-contact": "Sans contact", especes: "Espèces", "tickets-resto": "Tickets resto", "cheques-vacances": "Chèques-vacances" },
  reservation: { inutile: "Inutile", conseillee: "Conseillée", obligatoire: "Obligatoire" },
};

export const SOURCES_SUGGESTION: Record<string, string> = { client: "un client", pro: "le lieu lui-même" };
