import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { IMAGES_LIEU } from "@sos-miam/commun/regles/images-lieu";
import { Annonce } from "~/composants/interface/Annonce";
import { BlocImageLieuPro } from "~/composants/pro/BlocImageLieuPro";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserImagesLieuPro } from "~/hooks/utiliser-images-lieu-pro";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserModes } from "~/hooks/utiliser-modes";

export default function EcranImagesLieuPro() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { lieu } = utiliserLieuParId(lieuPro?.id ?? null);
  const images = utiliserImagesLieuPro(lieuPro?.id ?? null, lieu);
  const { T } = images;
  if (!lieuPro) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {T.titre}
        </Text>
      </View>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <Text className="font-texte text-base leading-6 text-gris">{T.intro}</Text>
        {IMAGES_LIEU.map((quelle) => (
          <BlocImageLieuPro
            key={quelle}
            quelle={quelle}
            source={images[quelle]}
            etape={images.occupee?.quelle === quelle ? images.occupee.etape : null}
            bloque={images.occupee !== null}
            T={T}
            onChoisir={() => void images.choisir(quelle)}
            onRetirer={() => void images.retirer(quelle)}
          />
        ))}
        <Text className="font-texte text-sm leading-5 text-gris">{T.regle}</Text>
      </ScrollView>
      <Annonce annonce={images.annonce} haut={marges.top + 12} onFin={images.finAnnonce} />
    </SafeAreaView>
  );
}
