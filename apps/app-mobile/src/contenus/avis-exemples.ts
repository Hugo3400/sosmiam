// Avis vérifiés INVENTÉS pour la démo (en développement seulement), sur Chez Nonna Lia (0), Sucre & Garrigue (1) et
// La Cabane d'Émile (13). Signés « Prénom I. », datés au mois à l'affichage ; un avis critique mais honnête, avec la
// réponse du lieu, montre qu'on ne retire pas un avis parce qu'il pique. Les dates sont relatives au départ de la démo.
import type { NoteAvis } from "@sos-miam/commun/types/avis";
import type { ModeValidation } from "@sos-miam/commun/types/visite";

export type AvisExemple = {
  lieuId: number;
  signature: string;
  note: NoteAvis;
  texte: string;
  preuve: ModeValidation;
  ilYaJours: number;
  reponseLieu: { texte: string; ilYaJours: number } | null;
};

export const avisExemples: readonly AvisExemple[] = [
  {
    lieuId: 0,
    signature: "Camille R.",
    note: 5,
    texte: "Les cacio e pepe de Lia sont une petite merveille, on sent que les pâtes ont été faites le matin même. On revient avec toute la bande.",
    preuve: "addition",
    ilYaJours: 12,
    reponseLieu: null,
  },
  {
    lieuId: 0,
    signature: "Mehdi T.",
    note: 3,
    texte: "Les pâtes étaient top, mais on a attendu 40 minutes un vendredi soir sans que personne ne nous prévienne. Avec un petit mot à l'arrivée, ça passait crème.",
    preuve: "comptoir",
    ilYaJours: 20,
    reponseLieu: {
      texte: "Merci Mehdi, tu as raison : ce soir-là, on était deux en cuisine au lieu de trois. Maintenant, on prévient dès l'arrivée quand ça déborde. Reviens, le tiramisu est pour nous !",
      ilYaJours: 19,
    },
  },
  {
    lieuId: 1,
    signature: "Jade L.",
    note: 5,
    texte: "Les grisettes au miel, c'est mon enfance en sachet. Clémence prend le temps de raconter la recette, on repart avec le sourire et les doigts collants.",
    preuve: "addition",
    ilYaJours: 8,
    reponseLieu: null,
  },
  {
    lieuId: 1,
    signature: "Paul D.",
    note: 4,
    texte: "Un peu cher pour un sachet, mais on sent le vrai savoir-faire. La réglisse, fonce sans réfléchir.",
    preuve: "comptoir",
    ilYaJours: 30,
    reponseLieu: null,
  },
  {
    lieuId: 13,
    signature: "Sofia M.",
    note: 5,
    texte: "Huîtres de l'étang, vue sur Bouzigues et accueil adorable. Émile raconte son métier mieux que n'importe quel guide.",
    preuve: "reservation",
    ilYaJours: 5,
    reponseLieu: null,
  },
  {
    lieuId: 13,
    signature: "Lucas P.",
    note: 4,
    texte: "Tout est d'une fraîcheur folle, les pieds presque dans l'eau. Seul bémol : prévois un pull, ça souffle fort sur l'étang.",
    preuve: "addition",
    ilYaJours: 15,
    reponseLieu: null,
  },
];
