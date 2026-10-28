import { useBottomTabBarHeight } from "expo-router/tabs";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { emoji: string; titre: string; texte: string };

/** Écran provisoire d'un onglet pas encore développé (la barre d'onglets est posée par-dessus : on lui laisse la place en bas). */
export function EcranBientot({ emoji, titre, texte }: Props) {
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <View style={{ paddingBottom: hauteurBarreOnglets }} className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-6xl">{emoji}</Text>
        <Text className="text-center font-titre text-3xl text-encre">{titre}</Text>
        <Text className="text-center font-texte text-base text-gris">{texte}</Text>
        <View className="mt-4 rounded-full border-2 border-encre bg-jaune px-5 py-2">
          <Text className="font-texte-gras text-nuit">{T.bientot}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
