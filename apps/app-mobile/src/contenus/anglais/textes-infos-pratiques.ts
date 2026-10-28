import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INFOS_PRATIQUES } from "~/contenus/textes-infos-pratiques";

export const TEXTES_INFOS_PRATIQUES_ANGLAIS: Traduction<typeof TEXTES_INFOS_PRATIQUES> = {
  titre: "Good to know",
  equipements: {
    accessible: "Wheelchair accessible",
    terrasse: "Terrace",
    wifi: "Wi-Fi",
    enfants: "High chair or kids' menu",
    parking: "Parking right next door",
  },
  appelerLu: (nom: string, telephone: string) => `Call ${nom}, ${telephone}`,
  site: "Website",
  siteLu: (nom: string) => `Open the website for ${nom}`,
  instagram: "Instagram",
  instagramLu: (nom: string) => `Open ${nom} on Instagram`,
  champs: {
    telephone: "Phone",
    site: "Website",
    instagram: "Instagram",
    facultatif: "optional",
    exempleInstagram: "@the.place",
    animaux: "Pets",
    reservation: "Booking",
    paiements: "Payments",
  },
  erreurs: {
    telephone: "A French number, like 04 67 12 34 56.",
    siteWeb: "A full address starting with https://",
    instagram: "The Instagram name, with no spaces (letters, numbers, full stops and _).",
    autre: "Something's not right – check your choices.",
  },
};
