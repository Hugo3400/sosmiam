import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CARTE_DES_LIEUX_ANGLAIS } from "~/contenus/anglais/carte-des-lieux";

export const TEXTES_CARTE_DES_LIEUX = {
  titre: "Carte des lieux",
  titreUnLieu: (nom: string) => `Carte autour de ${nom}`,
  titrePleinEcran: "Carte des lieux en plein écran",
  partout: "Toute la France",
  legende: {
    etiquette: "Légende de la carte",
    resto: "Resto",
    patisserie: "Pâtisserie",
    bar: "Bar",
    sortie: "Sortie",
    sos: "En SOS",
  },
  boutons: {
    pleinEcran: "Carte en plein écran",
    zoomer: "Zoomer",
    dezoomer: "Dézoomer",
    meSituer: "Me situer",
    fermer: "Fermer la carte",
    chercherZone: "Chercher dans cette zone",
    enSos: "En SOS ce soir",
    fermerLieu: "Fermer l'aperçu du lieu",
    filtres: "Filtrer la carte",
  },
  etats: {
    chargement: "La carte se prépare…",
    sansJavascript: "La carte a besoin de JavaScript pour s'afficher. Pas grave : la liste des lieux est là pour toi.",
    sansWebgl: "Ton navigateur ne sait pas dessiner cette carte. Pas grave : la liste des lieux est là pour toi.",
    erreur: "La carte fait une petite sieste. Réessaie dans un instant, ou jette un œil à la liste.",
    epinglesIndisponibles: "Les épingles n'ont pas pu se poser. Réessaie dans un instant.",
    aucuneEpingle: "Aucun lieu à épingler avec ces filtres.",
  },
  voirListe: "Voir la liste des lieux",
  lieuChoisi: {
    voirFiche: "Voir la fiche",
    itineraire: "Itinéraire",
    vers: (nom: string) => ` vers ${nom}`,
    de: (nom: string) => ` de ${nom}`,
    sos: "SOS ce soir",
  },
  meSituer: {
    recherche: "On cherche ta zone…",
    trouve: "Te voilà, à peu près : la carte montre ta zone, jamais ta position exacte.",
    refus: "Pas de souci : déplace la carte toi-même, ou choisis une ville.",
    indisponible: "On n'a pas trouvé ta position. Déplace la carte toi-même.",
  },
  zone: {
    recherche: "On regarde quelle ville est par là…",
    horsDeFrance: "Cette zone est hors de France : SOS Miam n'y est pas encore.",
    aucune: (commune: string) => `Pas encore de lieux autour de ${commune}. Déplace la carte vers une ville de la liste.`,
    voisine: (commune: string, ville: string) => `Pas encore de lieux à cet endroit (${commune}) : voici ${ville}, la plus proche qu'on connaît.`,
    dejaLa: (ville: string) => `Tu regardes déjà ${ville}. Déplace la carte vers une autre ville.`,
    trouvee: (ville: string) => `Direction ${ville} !`,
    tropDeDemandes: "Trop d'essais d'affilée : réessaie dans quelques minutes.",
    erreur: "La recherche de la ville n'a pas marché. Réessaie dans un instant.",
  },
  maplibre: {
    "Map.Title": "Carte des lieux",
    "CooperativeGesturesHandler.WindowsHelpText": "Ctrl + molette pour zoomer la carte",
    "CooperativeGesturesHandler.MacHelpText": "⌘ + molette pour zoomer la carte",
    "CooperativeGesturesHandler.MobileHelpText": "Deux doigts pour déplacer la carte",
  },
} as const;

export const TEXTES_CARTE_DES_LIEUX_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_DES_LIEUX>> = {
  fr: TEXTES_CARTE_DES_LIEUX,
  en: TEXTES_CARTE_DES_LIEUX_ANGLAIS,
};
