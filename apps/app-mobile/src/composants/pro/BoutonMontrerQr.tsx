import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  onPress: () => void;
  desactive?: boolean;
};

/** Le geste principal du comptoir : après le paiement, montrer le QR que le client scanne (pour 1 à 12 personnes). */
export function BoutonMontrerQr({ onPress, desactive = false }: Props) {
  return (
    <View className={`relative ${desactive ? "opacity-40" : ""}`}>
      <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-jaune" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Montrer le QR du comptoir"
        accessibilityHint="Après le paiement : le client le scanne et sa visite compte. Tu choisis pour combien de personnes."
        accessibilityState={{ disabled: desactive }}
        disabled={desactive}
        onPress={() => {
          vibrerLegerement();
          onPress();
        }}
        className="min-h-24 flex-row items-center gap-4 rounded-carte border-2 border-encre bg-encre px-5 py-5 active:opacity-90"
      >
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-jaune">
          <Ionicons name="qr-code" size={36} color={couleurs.encre} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-titre-gras text-2xl text-white">Montrer le QR</Text>
          <Text className="font-texte text-[15px] leading-[21px] text-white/80">Une fois payé, pour 1 à 12 personnes. Il change toutes les 30 s.</Text>
        </View>
      </Pressable>
    </View>
  );
}
