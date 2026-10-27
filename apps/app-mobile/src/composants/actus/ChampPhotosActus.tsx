import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { PHOTOS_ACTUS_MAX } from "@sos-miam/commun/regles/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  photos: readonly string[];
  preparation: boolean;
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onAjouter: () => void;
  onRetirer: (index: number) => void;
};

export function ChampPhotosActus({ photos, preparation, T, onAjouter, onRetirer }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-texte-semi text-base text-encre">{T.photos}</Text>
        <Text className="font-texte text-[13px] text-gris">{T.compteur(photos.length, PHOTOS_ACTUS_MAX)}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {photos.map((uri, i) => (
          <View key={uri} className="h-20 w-20 overflow-hidden rounded-xl border-2 border-encre">
            <Image source={{ uri }} accessible={false} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.retirerPhoto(i + 1)}
              hitSlop={8}
              onPress={() => onRetirer(i)}
              className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full border-2 border-encre bg-carte"
            >
              <Ionicons name="close" size={14} color={couleurs.encre} />
            </Pressable>
          </View>
        ))}
        {photos.length < PHOTOS_ACTUS_MAX ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.ajouterPhoto}
            onPress={onAjouter}
            disabled={preparation}
            className="h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-encre bg-carte active:opacity-80"
          >
            {preparation ? <ActivityIndicator color={couleurs.encre} /> : <Ionicons name="add" size={28} color={couleurs.encre} />}
          </Pressable>
        ) : null}
      </View>
      <Text className="font-texte text-sm leading-5 text-gris">{T.photosAide(PHOTOS_ACTUS_MAX)}</Text>
    </View>
  );
}
