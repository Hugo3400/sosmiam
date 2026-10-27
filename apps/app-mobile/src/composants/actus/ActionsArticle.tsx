import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  jaime: number;
  aime: boolean;
  commentaires: number;
  T: Traduction<typeof TEXTES_ACTUS>["article"];
  onAimer: () => void;
  onEnvoyer: () => void;
};

export function ActionsArticle({ jaime, aime, commentaires, T, onAimer, onEnvoyer }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.jaimeLu(jaime)}
        accessibilityState={{ selected: aime }}
        onPress={onAimer}
        className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-carte px-3.5 active:opacity-80"
      >
        <Ionicons name={aime ? "heart" : "heart-outline"} size={20} color={aime ? couleurs.tomate : couleurs.encre} />
        <Text className="font-texte-gras text-sm text-encre">{jaime}</Text>
      </Pressable>
      <View accessible accessibilityLabel={T.commentaires(commentaires)} className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-ligne px-3.5">
        <Ionicons name="chatbubble-outline" size={19} color={couleurs.encre} />
        <Text className="font-texte-gras text-sm text-encre">{commentaires}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onEnvoyer}
        className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-carte px-3.5 active:opacity-80"
      >
        <Ionicons name="paper-plane-outline" size={19} color={couleurs.encre} />
        <Text className="font-texte-gras text-sm text-encre">{T.envoyer}</Text>
      </Pressable>
    </View>
  );
}
