import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import couleurs from "~/theme/couleurs";

/** PROVISOIRE : carrousel de bienvenue (à construire avec diaposBienvenue). */
export default function Bienvenue() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.jaune }}>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Mascotte expression="miam" taille={180} />
        <Text className="text-center font-titre text-4xl text-encre">Sauve une table, régale-toi.</Text>
      </View>
      <View className="px-6 pb-4">
        <Bouton libelle="C'est parti" variante="encre" onPress={() => router.push("/compte")} />
      </View>
    </SafeAreaView>
  );
}
