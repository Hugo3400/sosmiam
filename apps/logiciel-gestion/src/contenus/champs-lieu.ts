// Noms des champs d'une fiche de lieu, pour les modifications proposées (dans l'ordre de la fiche).
export const LIBELLES_CHAMPS_LIEU: Record<string, string> = {
  nom: "Nom", type: "Type", info: "Ce que c'est", texte: "Présentation", adresse: "Adresse", quartier: "Quartier", ville: "Ville",
  latitude: "Latitude", longitude: "Longitude", prix: "Prix", prixMoyen: "Prix moyen", horaires: "Horaires",
  ouverture: "Créneaux d'ouverture", plat: "Plat signature", tags: "Mots-clés", envies: "Envies", reservable: "Réservable",
  telephone: "Téléphone", siteWeb: "Site web", instagram: "Instagram",
};

export const SOURCES_SUGGESTION: Record<string, string> = { client: "un client", pro: "le lieu lui-même" };
