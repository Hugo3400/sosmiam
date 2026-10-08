import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { MediaPublication } from "~/contenus/type-publication";

type Props = {
  photos: Extract<MediaPublication, { type: "photos" }>["photos"];
  largeur: number;
  hauteur: number;
  /** Publication affichée à l'écran : c'est là qu'on montre qu'on peut faire glisser les photos */
  actif: boolean;
  /** Appui sur une photo (deux appuis rapprochés : « J'aime », géré par la publication) */
  onAppui: () => void;
  /** Hauteur du compteur, juste sous l'en-tête du fil */
  haut: number;
};

// Petit glissement montré une fois, pour qu'on comprenne tout de suite qu'il y a d'autres photos à côté
const APERCU_GLISSEMENT = { delai: 700, distance: 56, retour: 380 };

/** Photos d'une publication, en plein écran, à faire glisser de côté ; une pastille « photos 1/3 » les distingue des vidéos. */
export function PhotosPublication({ photos, largeur, hauteur, actif, haut, onAppui }: Props) {
  const animationsReduites = useReducedMotion();
  const liste = useRef<FlatList>(null);
  const [actuelle, setActuelle] = useState(0);
  const apercuMontre = useRef(false);
  const plusieurs = photos.length > 1;

  useEffect(() => {
    if (!actif || !plusieurs || animationsReduites || apercuMontre.current) return;
    const aller = setTimeout(() => {
      apercuMontre.current = true;
      liste.current?.scrollToOffset({ offset: APERCU_GLISSEMENT.distance, animated: true });
    }, APERCU_GLISSEMENT.delai);
    const retour = setTimeout(() => liste.current?.scrollToOffset({ offset: 0, animated: true }), APERCU_GLISSEMENT.delai + APERCU_GLISSEMENT.retour);
    return () => {
      clearTimeout(aller);
      clearTimeout(retour);
    };
  }, [actif, plusieurs, animationsReduites]);

  return (
    <View style={{ position: "absolute", inset: 0 }}>
      <FlatList
        ref={liste}
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // Si on fait glisser soi-même, l'aperçu n'a plus lieu d'être
        onScrollBeginDrag={() => {
          apercuMontre.current = true;
        }}
        onScroll={(e) => setActuelle(Math.round(e.nativeEvent.contentOffset.x / largeur))}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          // Un appui laisse passer le glissement de côté ; deux appuis rapprochés font « J'aime » (VoiceOver passe par le bouton ❤️)
          <Pressable onPress={onAppui} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Image source={item} contentFit="cover" style={{ width: largeur, height: hauteur }} />
          </Pressable>
        )}
      />
      <View
        pointerEvents="none"
        accessible
        accessibilityLabel={plusieurs ? `Photo ${actuelle + 1} sur ${photos.length}` : "Photo"}
        style={{ top: haut }}
        className="absolute right-4 flex-row items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5"
      >
        <Ionicons name={plusieurs ? "images" : "image"} size={14} color="#FFFFFF" />
        <Text className="font-texte-gras text-xs text-white">{plusieurs ? `${actuelle + 1}/${photos.length}` : "Photo"}</Text>
      </View>
    </View>
  );
}
