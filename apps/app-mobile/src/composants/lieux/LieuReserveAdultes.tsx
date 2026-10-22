import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { BoutonSecoursMiamSafe } from "~/composants/miam-safe/BoutonSecoursMiamSafe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

/**
 * À la place de la fiche (ou de la carte) d'un bar, ouverte par un lien en visite sans compte : on ne connaît pas encore ton âge,
 * donc on reste tout public. Un mot gentil, « Je m'inscris » d'abord (l'inscription s'ouvre par-dessus, et une fois le compte
 * créé, la fiche s'ouvre ici), et de quoi trouver une autre adresse. Avec un compte, cet écran ne s'affiche jamais.
 */
export function LieuReserveAdultes() {
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
        <BoutonSecoursMiamSafe avecCreerCompte />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="items-center gap-4 px-8 pb-10 pt-4">
        <Mascotte expression="clin" taille={120} />
        <Text accessibilityRole="header" className="text-center font-titre text-[28px] leading-[32px] text-encre">
          Réservé aux 18 ans et plus
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Ici, on vient surtout trinquer. Sans compte, on ne connaît pas encore ton âge : en attendant, on reste tout public.")}
        </Text>
        <Text className="text-center font-texte-semi text-base leading-6 text-encre">
          {lierPonctuation("Tu as 18 ans ou plus ? Crée ton compte, et ce lieu t'ouvre ses portes.")}
        </Text>
        <View className="mt-2 w-full gap-3">
          <Bouton
            libelle="Je m'inscris (1 min)"
            variante="encre"
            indice="Ouvre l'inscription : Apple, Google ou ton e-mail"
            onPress={() => router.push("/compte")}
          />
          <Bouton
            libelle="Voir d'autres adresses"
            variante="blanc"
            indice="Ouvre Explorer, la carte et la liste des lieux"
            onPress={() => router.navigate("/explorer")}
          />
          <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
