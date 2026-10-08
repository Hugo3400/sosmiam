import type { MesureActivite } from "~/contenus/type-mesure-activite";

export type Defi = {
  id: string;
  emoji: string;
  titre: string;
  texte: string;
  objectif: number;
  /** Points du programme Ambassadeurs gagnés une fois le défi réussi */
  points: number;
  /** Date de fin, telle qu'affichée */
  fin: string;
  /** Lieux concernés (identifiants de lieux-exemples.ts) */
  lieux: number[];
  /** Mesure suivie sur le téléphone ; sans mesure, l'avancée attend les visites validées (API) */
  mesure?: MesureActivite;
};

/** Défis du moment (exemples repris du prototype, en attendant qu'ils viennent de l'API). */
export const defisExemples: Defi[] = [
  {
    id: "specialites",
    emoji: "🥧",
    titre: "Le tour des spécialités",
    texte: "Tielle sétoise, petit pâté de Pézenas, huîtres de Bouzigues et zézettes : goûte les 4",
    objectif: 4,
    points: 50,
    fin: "31 oct.",
    lieux: [9, 11, 13, 10],
  },
  {
    id: "sorties",
    emoji: "🛶",
    titre: "Bouge-toi le week-end",
    texte: "Teste 2 sorties : kayak, paddle, poterie ou escape game",
    objectif: 2,
    points: 30,
    fin: "31 oct.",
    lieux: [6, 7, 8, 12],
  },
  {
    id: "premiers",
    emoji: "🚀",
    titre: "Toujours le premier",
    texte: "Sois le premier sauveteur de 3 lieux",
    objectif: 3,
    points: 40,
    fin: "31 déc.",
    lieux: [],
    mesure: "premiers-sauvetages",
  },
  {
    id: "potes",
    emoji: "👯",
    titre: "Jamais sans mes potes",
    texte: "Organise une sortie entre potes et validez-la ensemble",
    objectif: 1,
    points: 20,
    fin: "31 oct.",
    lieux: [],
  },
];
