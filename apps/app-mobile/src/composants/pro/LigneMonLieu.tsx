import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  emoji: string;
  titre: string;
  detail: string;
  /** Absent : pas encore disponible (« Bientôt ») */
  onPress?: () => void;
};

/** Une entrée de « Mon lieu » : un emoji, un titre, où on en est, et la flèche (ou « Bientôt »). 64 pt de haut au moins. */
export function LigneMonLieu({ emoji, titre, detail, onPress }: Props) {
  const bientot = !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}. ${detail}${bientot ? ". Bientôt" : ""}`}
      accessibilityState={{ disabled: bientot }}
      disabled={bientot}
      onPress={() => {
        vibrerLegerement();
        onPress?.();
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-carte border-2 px-4 py-3 active:opacity-80 ${bientot ? "border-ligne bg-white/60" : "border-encre bg-white"}`}
    >
      <View className={`h-11 w-11 items-center justify-center rounded-2xl ${bientot ? "bg-ligne" : "bg-jaune-clair"}`}>
        <Text className="text-2xl">{emoji}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={`font-texte-gras text-base ${bientot ? "text-gris" : "text-encre"}`}>{titre}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(detail)}</Text>
      </View>
      {bientot ? (
        <View className="rounded-full bg-ligne px-2.5 py-1">
          <Text className="font-texte-gras text-xs text-gris">Bientôt</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={couleurs.encre} />
      )}
    </Pressable>
  );
}
