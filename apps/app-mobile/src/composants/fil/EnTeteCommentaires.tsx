import { Ionicons } from "@expo/vector-icons";
import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";

import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  /** Tous les commentaires visibles, réponses comprises */
  nombre: number;
  /** Mode démo : le bandeau honnête des potes d'exemple */
  demo: boolean;
  onFermer: () => void;
  /** Le titre, où la feuille replace le lecteur d'écran quand ce qu'on venait de toucher a disparu */
  refTitre?: Ref<Text>;
};

// Le bandeau honnête de la démo, affiché avec son éprouvette (🧪) mais lu sans
const TEXTE_DEMO = "Potes d'exemple : tes commentaires de démo restent sur ton téléphone. Quitte la démo pour retrouver tes vrais potes";

/** Le haut de la feuille des commentaires : combien il y en a, la croix pour la fermer, et (en démo) le bandeau des potes d'exemple. */
export function EnTeteCommentaires({ nombre, demo, onFermer, refTitre }: Props) {
  const couleurs = utiliserCouleurs();
  const titre = nombre === 0 ? "Commentaires" : `${formaterNombreCourt(nombre)} commentaire${nombre > 1 ? "s" : ""}`;
  return (
    <>
      <View className="flex-row items-center px-3">
        <View className="w-11" />
        <Text ref={refTitre} accessibilityRole="header" className="flex-1 text-center font-texte-gras text-base text-encre">
          {titre}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer les commentaires" onPress={onFermer} className="h-11 w-11 items-center justify-center active:opacity-60">
          <Ionicons name="close" size={24} color={couleurs.encre} />
        </Pressable>
      </View>
      {demo ? (
        <Text accessibilityLabel={`${TEXTE_DEMO}.`} className="mx-5 mb-1 text-center font-texte text-xs leading-4 text-gris">
          🧪 {TEXTE_DEMO}.
        </Text>
      ) : null}
    </>
  );
}
