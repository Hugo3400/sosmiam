import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

/** Le titre d'une section, avec « Tout voir » à droite quand il y a une page complète */
export function TitreSectionScan({ titre, libelleLu, onToutVoir }: { titre: string; libelleLu: string; onToutVoir?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text accessibilityRole="header" accessibilityLabel={libelleLu} className="font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      {onToutVoir ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tout voir : ${libelleLu}`}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            onToutVoir();
          }}
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">Tout voir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
