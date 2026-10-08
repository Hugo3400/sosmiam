import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/**
 * À la place de la fiche (ou de la carte) d'un bar, ouverte par un lien, quand ton âge ne le permet pas : moins de 18 ans,
 * ou âge inconnu (visite sans compte, contenu tout public). Un mot gentil, et de quoi trouver une autre adresse.
 */
export function LieuReserveAdultes() {
  const router = useRouter();
  const { profil } = utiliserProfil();
  // Ouvert par un lien, sans écran derrière : le retour mène au fil
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
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

      <ScrollView className="flex-1" contentContainerClassName="items-center gap-4 px-8 pb-10 pt-4">
        <Mascotte expression="clin" taille={120} />
        <Text accessibilityRole="header" className="text-center font-titre text-[28px] leading-[32px] text-encre">
          Réservé aux 18 ans et plus
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Ici, on vient surtout trinquer : ce lieu est gardé pour les grands. Plein d'autres adresses gourmandes t'attendent dans Explorer !")}
        </Text>
        {/* Sans compte, on ne connaît pas ton âge : on reste tout public (la date de naissance se donne à l'inscription) */}
        {profil === null ? (
          <Text className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Tu les as ? Une fois ton compte créé, il t'ouvrira ses portes.")}
          </Text>
        ) : null}
        <View className="mt-2 w-full gap-3">
          <Bouton libelle="Voir d'autres adresses" indice="Ouvre Explorer, la carte et la liste des lieux" onPress={() => router.navigate("/explorer")} />
          <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
