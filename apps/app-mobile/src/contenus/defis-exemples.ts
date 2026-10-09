import type { MesureActivite } from "~/contenus/type-mesure-activite";

export type Defi = {
  id: string;
  emoji: string;
  titre: string;
  texte: string;
  objectif: number;
  /** Points du programme Ambassadeurs gagnés une fois le défi réussi */
  points: number;
  /** Dernier jour du défi, « AAAA-MM-JJ » (formaté à l'affichage) ; sans date, pas d'échéance */
  fin?: string;
  /** Lieux concernés (identifiants de lieux-exemples.ts) */
  lieux: number[];
  /** Mesure suivie sur le téléphone ; sans mesure, le défi est « à venir » : il attend les visites validées (API) */
  mesure?: MesureActivite;
};

/**
 * Défis du moment (exemples repris du prototype, en attendant qu'ils viennent de l'API).
 * Ceux qui attendent les visites validées n'ont pas d'échéance : elle passerait avant qu'on puisse les réussir.
 */
export const defisExemples: Defi[] = [
  {
    id: "premiers",
    emoji: "🚀",
    titre: "Toujours le premier",
    // 1 et pas 3 : des 3 lieux tout juste arrivés des exemples, un seul est vérifié et ouvert à tous (le 15 n'a pas de compte
    // SOS Miam, donc pas de rescousse ; le 17 est un bar, caché avant 18 ans)
    texte: "Sois le premier sauveteur d'un lieu tout juste arrivé",
    objectif: 1,
    points: 40,
    fin: "2026-12-31",
    lieux: [],
    mesure: "premiers-sauvetages",
  },
  {
    id: "specialites",
    emoji: "🥧",
    titre: "Le tour des spécialités",
    texte: "Tielle sétoise, petit pâté de Pézenas, huîtres de Bouzigues et zézettes : goûte les 4",
    objectif: 4,
    points: 50,
    lieux: [9, 11, 13, 10],
  },
  {
    id: "sorties",
    emoji: "🛶",
    titre: "Bouge-toi le week-end",
    texte: "Teste 2 sorties : kayak, paddle, poterie ou escape game",
    objectif: 2,
    points: 30,
    lieux: [6, 7, 8, 12],
  },
  {
    id: "potes",
    emoji: "👯",
    titre: "Jamais sans mes potes",
    texte: "Organise une sortie entre potes et validez-la ensemble",
    objectif: 1,
    points: 20,
    lieux: [],
  },
];
