import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MESSAGE_COMPTE_LIMITE_ANGLAIS } from "./anglais/message-compte-limite.ts";

export const TEXTES_MESSAGE_COMPTE_LIMITE = {
  message: (fin: string, monCompte: string) =>
    `Rien n'est parti : ton compte est limité ${fin}. Tant que ça dure, ce que les autres verraient attend ; tout le reste marche comme d'habitude. Le pourquoi est dans « ${monCompte} », et tu peux y contester.`,
  monCompte: "Mon compte",
  jusquAu: (jour: string, heure: string) => `jusqu'au ${jour} à ${heure}`,
  heure: (heures: number, minutes: number) => `${heures} h${minutes === 0 ? "" : ` ${String(minutes).padStart(2, "0")}`}`,
  nouvelOrdre: "jusqu'à nouvel ordre",
};

export const TEXTES_MESSAGE_COMPTE_LIMITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MESSAGE_COMPTE_LIMITE>> = {
  fr: TEXTES_MESSAGE_COMPTE_LIMITE,
  en: TEXTES_MESSAGE_COMPTE_LIMITE_ANGLAIS,
};
