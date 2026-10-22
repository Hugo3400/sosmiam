import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { BoutonSecoursMiamSafe } from "~/composants/miam-safe/BoutonSecoursMiamSafe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  /** Le serveur n'a pas répondu : « Réessayer » ; sinon, on cherche encore */
  horsLigne: boolean;
  onReessayer: () => void;
};

/**
 * À la place de la fiche (ou de la carte) d'un lieu qu'on n'a pas encore : ouvert par un lien, ou tout juste publié. On le
 * cherche sur le serveur ; sans réseau, un mot pour le dire et « Réessayer ».
 */
export function LieuEnAttente({ horsLigne, onReessayer }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  // Ouvert par un lien, sans écran derrière : le retour mène au fil
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center justify-between px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={revenir}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        {horsLigne ? <BoutonSecoursMiamSafe sansInternet /> : null}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="items-center gap-4 px-8 pb-10 pt-4">
        {horsLigne ? (
          <>
            <Mascotte expression="clin" taille={120} />
            <Text accessibilityRole="header" className="text-center font-titre text-[28px] leading-[32px] text-encre">
              Pas de réseau
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation("Impossible d'ouvrir ce lieu pour l'instant. Vérifie ta connexion, puis réessaie : il t'attend.")}
            </Text>
            <View className="mt-2 w-full gap-3">
              <Bouton libelle="Réessayer" variante="jaune" onPress={onReessayer} />
              <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
            </View>
          </>
        ) : (
          <View accessible accessibilityLabel="On ouvre ce lieu" className="items-center gap-4 pt-16">
            <ActivityIndicator size="large" color={couleurs.encre} />
            <Text className="text-center font-texte text-base text-gris">On ouvre la porte…</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
