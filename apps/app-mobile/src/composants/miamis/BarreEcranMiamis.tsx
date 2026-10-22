import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  titre: string;
  grand?: boolean;
  icone?: "retour" | "fermer";
  libelleRetour?: string;
  onRetour?: () => void;
  droite?: ReactNode;
};

export function BarreEcranMiamis({ titre, grand = false, icone = "retour", libelleRetour, onRetour, droite }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const revenir = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/potes", params: { espace: "miamis" } }));

  return (
    <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={libelleRetour ?? (icone === "fermer" ? "Fermer" : "Retour")}
        hitSlop={8}
        onPress={onRetour ?? revenir}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Ionicons name={icone === "fermer" ? "close" : "arrow-back"} size={20} color={couleurs.encre} />
      </Pressable>
      {grand ? (
        <Text accessibilityRole="header" numberOfLines={2} className="flex-1 font-titre text-[28px] leading-[32px] text-encre">
          {titre}
        </Text>
      ) : (
        <Text accessibilityRole="header" numberOfLines={1} className="flex-1 text-center font-texte-gras text-base text-encre">
          {titre}
        </Text>
      )}
      {droite ?? (grand ? null : <View className="h-11 w-11" />)}
    </View>
  );
}
