import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INSCRIPTION_VILLE_ANGLAIS } from "~/contenus/anglais/textes-inscription-ville";

export const TEXTES_INSCRIPTION_VILLE = {
  erreurs: {
    refus: "Pas de souci, ta position reste à toi : écris ta ville juste en dessous.",
    "refus-definitif":
      "Tu avais dit non à ta position, et c'est ton droit ! Si tu changes d'avis, ça se passe dans les réglages du téléphone. Sinon, écris ta ville juste en dessous.",
    coupee: "Ta localisation est coupée sur le téléphone : active-la dans ses réglages, ou écris ta ville juste en dessous.",
    introuvable: "On n'a pas réussi à trouver ta ville : écris-la juste en dessous.",
    "reglages-fermes": "Les réglages n'ont pas voulu s'ouvrir : tu les trouveras dans l'appli Réglages du téléphone. Ou écris ta ville juste en dessous.",
  },
  caracteres: "Juste des lettres ici : pas de code postal ni de symboles, le nom de ta ville suffit.",
  incomplet: "Il manque un petit bout : écris le nom de ta ville en entier.",
  notePosition: "Ta position sert juste à trouver le nom de ta ville : on ne la garde pas.",
  villesProposees: (n: number) => (n === 1 ? "1 ville proposée, juste au-dessus du champ" : `${n} villes proposées, juste au-dessus du champ`),
  villeTrouvee: (ville: string) => `Ville trouvée : ${ville}`,
  titre: "Ta ville",
  sousTitre: "Pour te montrer les bons plans près de chez toi.",
  utiliserPosition: "Utiliser ma position",
  indicePosition: "Trouve ta ville avec la position du téléphone, lue une seule fois",
  rechercheEnCours: "On cherche ta ville…",
  ouvrirReglages: "Ouvrir les réglages du téléphone",
  ou: "ou",
  indiceVille: "Choisit cette ville",
  ecrisTaVille: "Écris ta ville",
};

export const TEXTES_INSCRIPTION_VILLE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INSCRIPTION_VILLE>> = {
  fr: TEXTES_INSCRIPTION_VILLE,
  en: TEXTES_INSCRIPTION_VILLE_ANGLAIS,
};
