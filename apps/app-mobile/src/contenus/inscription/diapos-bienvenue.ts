// Carrousel de bienvenue (première ouverture de l'app) : le concept de SOS Miam, raconté par la mascotte.
import type { ExpressionMascotte } from "~/composants/marque/Mascotte";

export type DiapoBienvenue = {
  id: string;
  expression: ExpressionMascotte;
  titre: string;
  texte: string;
  /** Couleur de fond de la diapo (nom d'une couleur de src/theme/couleurs.js) */
  fond: "jaune" | "jaune-clair" | "creme" | "rose-alerte";
};

export const diaposBienvenue: DiapoBienvenue[] = [
  {
    id: "salut",
    expression: "miam",
    titre: "Salut, moi c'est la bouée de SOS\u00a0Miam !",
    texte: "Je te fais découvrir les restos, pâtisseries, bars et sorties de ton coin qui ont besoin de monde.",
    fond: "jaune",
  },
  {
    id: "sos",
    expression: "surprise",
    titre: "Un lieu lance un SOS",
    texte: "Une salle calme ce soir, une pépite qui vient d'ouvrir… Tu reçois l'alerte, tu y vas, tu te régales.",
    fond: "jaune-clair",
  },
  {
    id: "rescousses",
    expression: "clin",
    titre: "3 rescousses par semaine",
    texte: "Donne-les aux lieux que tu aimes : ils remontent dans le fil. Ta visite est validée quand tu paies, et tes rescousses reviennent chaque lundi.",
    fond: "creme",
  },
  {
    id: "big-sos",
    expression: "miam",
    titre: "Le BIG SOS",
    texte: "Quand un lieu traverse un vrai coup dur, tout le quartier vient à la rescousse pendant 7 jours. Ensemble, on remplit la salle.",
    fond: "rose-alerte",
  },
  {
    id: "gratuit",
    expression: "clin",
    titre: "Et c'est 100 % gratuit",
    texte: "Pour toi comme pour les lieux. Déniche des pépites, fais-les découvrir et deviens ambassadeur de ton quartier.",
    fond: "jaune",
  },
];
