import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ContenuMessages } from "~/composants/chat/ContenuMessages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

/**
 * Messages : les invitations à rejoindre un groupe (compte connecté), tes conversations privées et de groupe, la plus récente
 * d'abord, et de quoi en lancer une nouvelle.
 */
export default function Messages() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { nonLus } = utiliserConversations();

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={retour}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ContenuMessages
        margeBas={marges.bottom + 24}
        enTete={
          <View>
            <Text
              accessibilityRole="header"
              accessibilityLabel={nonLus > 0 ? `Messages, ${nonLus} non lu${nonLus > 1 ? "s" : ""}` : "Messages"}
              className="font-titre text-[32px] leading-[36px] text-encre"
            >
              Messages
            </Text>
            <Text className="mt-2 font-texte text-base leading-6 text-gris">
              {lierPonctuation("En privé ou en groupe, avec ta bande. Les meilleurs plans miam commencent par un « t'as faim ? ».")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
