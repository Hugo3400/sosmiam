import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiapoBienvenue } from "~/composants/inscription/DiapoBienvenue";
import { PointsPagination } from "~/composants/inscription/PointsPagination";
import { Bouton } from "~/composants/interface/Bouton";
import { diaposBienvenue, type DiapoBienvenue as Diapo } from "~/contenus/inscription/diapos-bienvenue";

// Hauteur réservée en bas aux points et au bouton, au-dessus de la zone sûre
const HAUTEUR_COMMANDES = 132;

/** Premier écran de l'app : le concept de SOS Miam en 5 diapos, racontées par la mascotte. */
export default function Bienvenue() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const marges = useSafeAreaInsets();
  const liste = useRef<FlatList<Diapo>>(null);
  const [actif, setActif] = useState(0);
  const derniere = actif === diaposBienvenue.length - 1;

  const continuer = () => router.push("/compte");

  function suivant() {
    if (derniere) return continuer();
    liste.current?.scrollToIndex({ index: actif + 1, animated: true });
    setActif(actif + 1);
  }

  function auDefilement(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setActif(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <View className="flex-1">
      <FlatList
        ref={liste}
        data={diaposBienvenue}
        keyExtractor={(diapo) => diapo.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={auDefilement}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <DiapoBienvenue diapo={item} largeur={width} hauteur={height} active={index === actif} margeBas={HAUTEUR_COMMANDES + marges.bottom} />
        )}
      />

      {derniere ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer la présentation"
          hitSlop={12}
          onPress={continuer}
          style={{ top: marges.top + 8 }}
          className="absolute right-5 min-h-11 justify-center rounded-full bg-white/70 px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-base text-encre">Passer</Text>
        </Pressable>
      )}

      <View style={{ paddingBottom: marges.bottom + 16 }} className="absolute inset-x-0 bottom-0 gap-6 px-6">
        <PointsPagination total={diaposBienvenue.length} actif={actif} />
        <Bouton
          libelle={derniere ? "C'est parti" : "Suivant"}
          variante={derniere ? "encre" : "blanc"}
          indice={derniere ? "Commence ton inscription" : "Affiche la diapo suivante"}
          onPress={suivant}
        />
      </View>
    </View>
  );
}
