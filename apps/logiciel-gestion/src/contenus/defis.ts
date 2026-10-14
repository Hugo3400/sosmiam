// Libellés des défis (mêmes clés et limites que packages/commun/src/regles/defis.ts).
import type { BrouillonDefi, MesureDefi } from "../services/defis.ts";

/** Ce que compte chaque mesure (singulier, pluriel), dans l'ordre du formulaire */
export const MESURES_DEFI: Record<MesureDefi, readonly [string, string]> = {
  visites: ["visite validée", "visites validées"],
  "lieux-differents": ["lieu différent visité", "lieux différents visités"],
  "villes-differentes": ["ville différente", "villes différentes"],
  "semaines-d-affilee": ["semaine avec une visite", "semaines d'affilée avec une visite"],
  rescousses: ["rescousse donnée", "rescousses données"],
  "premiers-sauvetages": ["lieu sauvé en premier", "lieux sauvés en premier"],
  avis: ["avis publié", "avis publiés"],
};

/** Les filtres permis pour chaque mesure */
export const FILTRES_PAR_MESURE: Record<MesureDefi, readonly ("typesLieu" | "apresHeure" | "pendantSos" | "avecPhoto")[]> = {
  rescousses: [],
  "premiers-sauvetages": [],
  visites: ["typesLieu", "apresHeure", "pendantSos"],
  "lieux-differents": ["typesLieu", "apresHeure", "pendantSos"],
  "villes-differentes": ["typesLieu"],
  "semaines-d-affilee": ["typesLieu"],
  avis: ["avecPhoto"],
};

/** Jamais « bar » : un défi rapporte des points, et des points pour aller au bar pousseraient à boire (loi Évin) */
export const TYPES_LIEU_DEFI: Record<string, string> = { resto: "Restos", patisserie: "Pâtisseries", sortie: "Sorties" };

export const LIMITES_DEFI = { titre: 60, texte: 300, objectif: [1, 100], points: [0, 200], ordre: [0, 999], apresHeure: [12, 23] } as const;

/** Les noms des champs, pour dire lequel ne va pas */
export const CHAMPS_DEFI: Record<keyof BrouillonDefi, string> = {
  emoji: "Emoji", titre: "Titre", texte: "Texte", mesure: "Ce qui compte", filtres: "Filtres", objectif: "Objectif", points: "Points",
  debut: "Premier jour", fin: "Dernier jour", publie: "Publié", ordre: "Ordre",
};
