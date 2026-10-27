import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = { libelle: string; libelleLu: string; bas: number; onPress: () => void };

export function BoutonEcrireActus({ libelle, libelleLu, bas, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      onPress={onPress}
      style={{ bottom: bas, shadowColor: couleurs.encre, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
      className="absolute right-4 min-h-[52px] flex-row items-center gap-2 rounded-full border-2 border-nuit bg-jaune px-5 active:opacity-90"
    >
      <Ionicons name="create-outline" size={20} color="#1A1A1A" />
      <Text maxFontSizeMultiplier={1.3} className="font-texte-gras text-[15px] text-nuit">
        {libelle}
      </Text>
    </Pressable>
  );
}
