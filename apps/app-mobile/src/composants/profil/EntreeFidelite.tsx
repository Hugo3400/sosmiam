import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

/**
 * La rangée « 🎟️ Mes cartes de fidélité » du profil : combien de cartes, et combien de récompenses t'attendent.
 * Elle ouvre la liste de tes cartes.
 */
export function EntreeFidelite() {
  const router = useRouter();
  const { cartes } = utiliserVisites();
  const pretes = cartes.reduce((somme, c) => somme + c.pretes.length, 0);
  const detail =
    cartes.length === 0
      ? "Pas encore de carte : un tampon à chaque visite validée"
      : `${cartes.length} carte${cartes.length > 1 ? "s" : ""}${pretes > 0 ? ` · ${pretes} récompense${pretes > 1 ? "s" : ""} t'attend${pretes > 1 ? "ent" : ""} 🎁` : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mes cartes de fidélité, ${detail.replace(" 🎁", "")}`}
      accessibilityHint="Ouvre tes cartes de fidélité"
      onPress={() => {
        vibrerLegerement();
        router.push("/fidelite");
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white px-4 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune">
        <Text className="text-xl">🎟️</Text>
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">Mes cartes de fidélité</Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detail)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
    </Pressable>
  );
}
