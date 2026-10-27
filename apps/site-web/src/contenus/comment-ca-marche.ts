import { POINTS_AMBASSADEUR } from "../../../../packages/commun/src/regles/ambassadeurs.ts";
import { RESCOUSSES_PAR_SEMAINE } from "../../../../packages/commun/src/regles/rescousses.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_COMMENT_CA_MARCHE_ANGLAIS } from "~/contenus/anglais/comment-ca-marche";

export const TEXTES_COMMENT_CA_MARCHE = {
  surtitre: "Comment ça marche",
  titre: "Quatre gestes, et un petit lieu de ton quartier passe un meilleur mois.",
  mascotte: "Le Capitaine Bouiboui annonce une place ce soir",
  etapes: [
    {
      titre: "Trouve ta pépite",
      texte: "Fais défiler les restos, pâtisseries et bars près de chez toi. Les lieux en SOS ce soir passent en tête.",
      gain: "Quartier, budget ou envie",
    },
    {
      titre: "Fonce quand ça sonne",
      texte: "Un lieu a des tables libres ce soir ? Il lance un SOS, le Capitaine donne l'alerte : à toi de jouer.",
      gain: `+${POINTS_AMBASSADEUR.visiteSos} points pendant un SOS`,
    },
    {
      titre: "Valide ta visite",
      texte: "Demande l'addition dans l'app, ou scanne le QR du comptoir : ton passage est vérifié, ton avis compte vraiment.",
      gain: `+${POINTS_AMBASSADEUR.visite} points et un tampon`,
    },
    {
      titre: "Viens à la rescousse",
      texte: `Tu as ${RESCOUSSES_PAR_SEMAINE} rescousses par semaine, rechargées le lundi. Offre-les aux lieux qui le méritent : c'est ton coup de pouce.`,
      gain: `+${POINTS_AMBASSADEUR.rescousse} points par rescousse`,
    },
  ],
  verifies: {
    debut: "Points, tampons et rescousses marchent dans les lieux ",
    badge: "Vérifiés ✓",
    fin: ", ceux qui tiennent leur fiche sur SOS Miam.",
  },
  bouton: "Préviens-moi quand l'app sort",
};

export const TEXTES_COMMENT_CA_MARCHE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COMMENT_CA_MARCHE>> = {
  fr: TEXTES_COMMENT_CA_MARCHE,
  en: TEXTES_COMMENT_CA_MARCHE_ANGLAIS,
};
