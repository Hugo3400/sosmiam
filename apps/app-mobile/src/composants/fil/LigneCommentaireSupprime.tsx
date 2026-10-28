import { Text, View } from "react-native";

import { TEXTES_COMMENTAIRES_FIL_PAR_LANGUE } from "~/contenus/textes-commentaires-fil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Réponse sous un commentaire : un peu en retrait, rond plus petit */
  reponse: boolean;
};

/**
 * « Commentaire supprimé » : son auteur l'a retiré, mais d'autres y avaient répondu (leurs réponses restent rangées dessous).
 * Ni J'aime, ni « Répondre », ni options : il n'y a plus rien à lire.
 */
export function LigneCommentaireSupprime({ reponse }: Props) {
  const taille = reponse ? 30 : 40;
  const T = utiliserTextes(TEXTES_COMMENTAIRES_FIL_PAR_LANGUE).ligne;
  return (
    <View accessible accessibilityLabel={T.supprime} className={`flex-row items-center gap-3 ${reponse ? "ml-[52px] py-1.5" : "py-2"}`}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: taille, height: taille, borderRadius: taille / 2 }}
        className="border-2 border-dashed border-gris/60"
      />
      <Text className="flex-1 font-texte text-sm italic text-gris">{T.supprime}</Text>
    </View>
  );
}
