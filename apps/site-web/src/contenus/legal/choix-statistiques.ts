import type { ParLangue, Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CHOIX_STATISTIQUES_ANGLAIS } from "~/contenus/anglais/legal/choix-statistiques";

export const TEXTES_CHOIX_STATISTIQUES = {
  comptees: "Tes visites sont comptées",
  nonComptees: "Tes visites ne sont pas comptées",
  signalNavigateur:
    "Ton navigateur demande à ne pas être suivi (signal « Global Privacy Control » ou « Do Not Track ») : on respecte, tu n'es pas compté. Rien d'autre à faire.",
  refus: "C'est noté : un petit cookie retient ton choix pendant 13 mois dans ce navigateur. Il ne sert qu'à ça. Si tu effaces tes cookies, il faudra refaire ton choix.",
  proposition: "Tu préfères ne pas être compté, même anonymement ? Un clic suffit. On garde ton choix 13 mois dans un petit cookie qui ne sert qu'à ça.",
  compterANouveau: "Compter à nouveau mes visites",
  nePlusCompter: "Ne plus compter mes visites",
};

export const TEXTES_CHOIX_STATISTIQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHOIX_STATISTIQUES>> = {
  fr: TEXTES_CHOIX_STATISTIQUES,
  en: TEXTES_CHOIX_STATISTIQUES_ANGLAIS,
};
