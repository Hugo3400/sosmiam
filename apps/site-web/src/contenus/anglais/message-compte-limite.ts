import { formaterHeureLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-heure-langue.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MESSAGE_COMPTE_LIMITE } from "../message-compte-limite.ts";

export const TEXTES_MESSAGE_COMPTE_LIMITE_ANGLAIS: Traduction<typeof TEXTES_MESSAGE_COMPTE_LIMITE> = {
  message: (fin: string, monCompte: string) =>
    `Nothing was sent: your account is restricted ${fin}. While it lasts, anything other people would see has to wait – everything else works as usual. The reason is in “${monCompte}”, where you can also appeal.`,
  monCompte: "My account",
  jusquAu: (jour: string, heure: string) => `until ${jour} at ${heure}`,
  heure: (heures: number, minutes: number) => formaterHeureLangue(heures, minutes, "en"),
  nouvelOrdre: "until further notice",
};
