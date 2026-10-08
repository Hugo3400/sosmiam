import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import couleurs from "~/theme/couleurs";

/** Onglet « Pour toi » : pour l'instant, l'accueil provisoire de l'app. */
export default function PourToi() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <Text className="text-3xl font-extrabold text-encre">
          SOS <Text className="text-tomate">Miam</Text>
        </Text>
        <View className="self-start rounded-full bg-jaune-clair px-3 py-1.5">
          <Text className="font-semibold text-encre">🛟 Bientôt à Montpellier et dans l'Hérault</Text>
        </View>
        <Text className="text-4xl font-extrabold leading-tight text-encre">Sauve une table, régale-toi.</Text>
        <Text className="text-base text-gris">
          Les restos, pâtisseries, bars et sorties de ton coin qui ont besoin de monde, à portée de pouce.
        </Text>
        <View className="rounded-carte border-2 border-encre bg-white p-5">
          <Text className="text-lg font-extrabold text-encre">🍳 Ça mijote en cuisine</Text>
          <Text className="mt-1 text-gris">Tu regardes la toute première version de l'app : les onglets sont là, les lieux arrivent.</Text>
        </View>
        <View className="items-center rounded-full border-2 border-encre bg-jaune py-3">
          <Text className="text-base font-bold text-encre">3 rescousses à donner cette semaine</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
