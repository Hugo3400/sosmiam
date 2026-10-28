import Ionicons from "@expo/vector-icons/Ionicons";
import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";

import { TEXTES_COMMENTAIRES_FIL_PAR_LANGUE } from "~/contenus/textes-commentaires-fil";
import { formaterNombreCourtLangue } from "~/fonctions/langue/formater-nombre-court-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Tous les commentaires visibles, réponses comprises */
  nombre: number;
  onFermer: () => void;
  /** Le titre, où la feuille replace le lecteur d'écran quand ce qu'on venait de toucher a disparu */
  refTitre?: Ref<Text>;
};

/** Le haut de la feuille des commentaires : combien il y en a, et la croix pour la fermer. */
export function EnTeteCommentaires({ nombre, onFermer, refTitre }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_COMMENTAIRES_FIL_PAR_LANGUE);
  const titre = nombre === 0 ? T.titreVide : T.titre(formaterNombreCourtLangue(nombre, langue), nombre);
  return (
    <View className="flex-row items-center px-3">
      <View className="w-11" />
      <Text ref={refTitre} accessibilityRole="header" className="flex-1 text-center font-texte-gras text-base text-encre">
        {titre}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={T.fermer} onPress={onFermer} className="h-11 w-11 items-center justify-center active:opacity-60">
        <Ionicons name="close" size={24} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
