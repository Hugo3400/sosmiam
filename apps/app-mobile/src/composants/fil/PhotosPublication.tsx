import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, View } from "react-native";

import type { MediaPublication } from "~/contenus/type-publication";

type Props = {
  photos: Extract<MediaPublication, { type: "photos" }>["photos"];
  largeur: number;
  hauteur: number;
};

/** Photos d'une publication, en plein écran, à faire glisser de côté ; petits traits en haut pour savoir où on en est. */
export function PhotosPublication({ photos, largeur, hauteur }: Props) {
  const [actuelle, setActuelle] = useState(0);
  return (
    <View style={{ position: "absolute", inset: 0 }}>
      <FlatList
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActuelle(Math.round(e.nativeEvent.contentOffset.x / largeur))}
        renderItem={({ item }) => <Image source={item} contentFit="cover" style={{ width: largeur, height: hauteur }} />}
      />
      {photos.length > 1 ? (
        <View pointerEvents="none" className="absolute inset-x-0 top-24 flex-row justify-center gap-1.5">
          {photos.map((_, i) => (
            <View key={i} className={`h-1.5 rounded-full ${i === actuelle ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
