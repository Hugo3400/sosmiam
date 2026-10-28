import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_QR_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-qr-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  onPress: () => void;
  desactive?: boolean;
};

/** Le geste principal du comptoir : après le paiement, montrer le QR que le client scanne (pour 1 à 12 personnes). */
export function BoutonMontrerQr({ onPress, desactive = false }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_QR_COMPTOIR_PAR_LANGUE);
  return (
    <View className={`relative ${desactive ? "opacity-40" : ""}`}>
      <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-jaune" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.montrerLu}
        accessibilityHint={T.montrerIndice}
        accessibilityState={{ disabled: desactive }}
        disabled={desactive}
        onPress={() => {
          vibrerLegerement();
          onPress();
        }}
        className="min-h-24 flex-row items-center gap-4 rounded-carte border-2 border-encre bg-nuit px-5 py-5 active:opacity-90"
      >
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-jaune">
          <Ionicons name="qr-code" size={36} color={couleurs.nuit} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-titre-gras text-2xl text-white">{T.montrer}</Text>
          <Text className="font-texte text-[15px] leading-[21px] text-white/80">{T.montrerDetail}</Text>
        </View>
      </Pressable>
    </View>
  );
}
