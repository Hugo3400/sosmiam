import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INFOS_PRATIQUES_ANGLAIS } from "~/contenus/anglais/textes-infos-pratiques";

export const TEXTES_INFOS_PRATIQUES = {
  titre: "Infos pratiques",
  equipements: {
    accessible: "Accessible en fauteuil roulant",
    terrasse: "Terrasse",
    wifi: "Wi-Fi",
    enfants: "Chaise haute ou menu enfant",
    parking: "Parking juste à côté",
  },
  appelerLu: (nom: string, telephone: string) => `Appeler ${nom}, ${telephone}`,
  site: "Site",
  siteLu: (nom: string) => `Ouvrir le site de ${nom}`,
  instagram: "Instagram",
  instagramLu: (nom: string) => `Ouvrir l'Instagram de ${nom}`,
  champs: {
    telephone: "Téléphone",
    site: "Site",
    instagram: "Instagram",
    facultatif: "facultatif",
    exempleInstagram: "@le.lieu",
    animaux: "Les animaux",
    reservation: "La réservation",
    paiements: "Les paiements",
  },
  erreurs: {
    telephone: "Un numéro français, comme 04 67 12 34 56.",
    siteWeb: "Une adresse complète qui commence par https://",
    instagram: "Le nom Instagram, sans espace (lettres, chiffres, points et _).",
    autre: "Une info ne passe pas : vérifie tes choix.",
  },
};

export const TEXTES_INFOS_PRATIQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INFOS_PRATIQUES>> = { fr: TEXTES_INFOS_PRATIQUES, en: TEXTES_INFOS_PRATIQUES_ANGLAIS };
