import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ContenuMessages } from "~/composants/chat/ContenuMessages";
import { TEXTES_ECRAN_DISCUSSION_PAR_LANGUE } from "~/contenus/textes-ecran-discussion";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Messages : les invitations à rejoindre un groupe (compte connecté), tes conversations privées et de groupe, la plus récente
 * d'abord, et de quoi en lancer une nouvelle.
 */
export default function Messages() {
  const T = utiliserTextes(TEXTES_ECRAN_DISCUSSION_PAR_LANGUE);
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
          accessibilityLabel={T.retour}
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
              accessibilityLabel={nonLus > 0 ? T.messagesNonLus(nonLus) : T.messages}
              className="font-titre text-[32px] leading-[36px] text-encre"
            >
              {T.messages}
            </Text>
            <Text className="mt-2 font-texte text-base leading-6 text-gris">
              {lierPonctuation(T.messagesIntro)}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
