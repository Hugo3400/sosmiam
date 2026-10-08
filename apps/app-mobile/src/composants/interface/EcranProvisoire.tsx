import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  emoji: string;
  titre: string;
  texte: string;
  /** Bouton sous le texte (« Revenir à mon SOS Miam » dans un mode) ; sans lui, une flèche « Retour » en haut */
  action?: { libelle: string; onPress: () => void };
};

/**
 * Écran provisoire d'une page pas encore développée, hors des onglets perso (EcranBientot, lui, laisse la place
 * à leur barre). Remplacé page par page par les lots suivants.
 */
export function EcranProvisoire({ emoji, titre, texte, action }: Props) {
  const router = useRouter();
  const navigation = useNavigation();

  // Retour à l'écran d'avant. Premier écran d'une pile ouverte en plein écran (Scan, mode pro…) : on referme la pile
  // entière par son parent (sur iPhone, le retour global ne referme pas toujours ce genre de pile). Ouvert directement
  // (lien, rechargement de la page web) : retour aux onglets.
  function revenir() {
    const parent = navigation.getParent();
    if (navigation.getState()?.index === 0 && parent?.canGoBack()) parent.goBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else router.replace("/");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      {action ? null : (
        <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={revenir}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerClassName="flex-grow items-center justify-center gap-3 px-8 pb-8">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-6xl">
          {emoji}
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
          {lierPonctuation(titre)}
        </Text>
        <Text className="text-center font-texte text-base text-gris">{lierPonctuation(texte)}</Text>
        <View className="mt-4 rounded-full border-2 border-encre bg-jaune px-5 py-2">
          <Text className="font-texte-gras text-encre">Bientôt dans l'app</Text>
        </View>
        {action ? <Bouton libelle={action.libelle} onPress={action.onPress} variante="blanc" className="mt-6 self-stretch" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
