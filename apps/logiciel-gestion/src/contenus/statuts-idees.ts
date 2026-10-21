import type { StatutIdee } from "../../../../packages/commun/src/types/idees.ts";

export const STATUTS_IDEE: { valeur: StatutIdee; libelle: string }[] = [
  { valeur: "en-relecture", libelle: "En relecture" },
  { valeur: "proposee", libelle: "Proposée" },
  { valeur: "a-l-etude", libelle: "À l'étude" },
  { valeur: "prevue", libelle: "Prévue" },
  { valeur: "faite", libelle: "C'est fait !" },
];
