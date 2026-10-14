import type { DefiApp } from "@sos-miam/commun/types/defi";
import type { MesureActivite } from "~/contenus/type-mesure-activite";

/** Un défi d'exemple de la démo : comme un défi du serveur, sans l'avancée (comptée sur le téléphone) */
export type DefiExemple = Omit<DefiApp, "fait" | "etat" | "reussiLe"> & {
  /** Mesure suivie sur le téléphone ; sans mesure, le défi reste « à venir » dans la démo (il attend, sans jauge) */
  mesure?: MesureActivite;
};

/**
 * Défis de la démo seulement (bouton « Démo ») : avec un compte, les défis viennent du serveur, gérés dans le logiciel de
 * gestion. Ceux que le téléphone ne sait pas compter n'ont pas d'échéance : elle passerait avant qu'on puisse les réussir.
 */
export const defisExemples: DefiExemple[] = [
  {
    id: 1,
    emoji: "🚀",
    titre: "Premiers de cordée",
    // 3 (décidé le 14 octobre 2026) : le badge « Premier sauveteur » paie déjà le premier, le défi en demande plusieurs.
    // Des 3 lieux tout juste arrivés des exemples, deux peuvent recevoir ta rescousse, le 16 et le 17 (le 15 n'a pas de
    // compte SOS Miam, donc pas de rescousse) : dans la démo, ce défi s'arrête à 2 sur 3
    texte: "Sois le tout premier à donner une rescousse à 3 lieux qui viennent d'arriver",
    objectif: 3,
    points: 40,
    debut: "2026-10-14",
    fin: "2026-12-31",
    mesure: "premiers-sauvetages",
  },
  {
    id: 2,
    emoji: "🥧",
    titre: "Le tour des spécialités",
    texte: "Tielle sétoise, petit pâté de Pézenas, huîtres de Bouzigues et zézettes : goûte les 4",
    objectif: 4,
    points: 50,
    debut: "2026-10-14",
    fin: null,
  },
  {
    id: 3,
    emoji: "🛶",
    titre: "Bouge-toi le week-end",
    texte: "Teste 2 sorties : kayak, paddle, poterie ou escape game",
    objectif: 2,
    points: 30,
    debut: "2026-10-14",
    fin: null,
  },
  {
    id: 4,
    emoji: "👯",
    titre: "Jamais sans mes potes",
    texte: "Organise une sortie entre potes et validez-la ensemble",
    objectif: 1,
    points: 20,
    debut: "2026-10-14",
    fin: null,
  },
];
