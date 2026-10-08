import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { raisonsSignalement, type ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  onChoisir: (raison: ChoixRaisonSignalement) => void;
};

/** Première étape du signalement : pourquoi tu signales (une raison à toucher, qui mène à l'étape suivante). */
export function ListeRaisonsSignalement({ onChoisir }: Props) {
  return (
    <View>
      {raisonsSignalement.map((raison) => (
        <Pressable
          key={raison.cle}
          accessibilityRole="button"
          accessibilityLabel={raison.titre}
          accessibilityHint={raison.detail}
          onPress={() => {
            vibrerLegerement();
            onChoisir(raison);
          }}
          className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
        >
          <Text className="text-2xl">{raison.emoji}</Text>
          <View className="flex-1">
            <Text className="font-texte-gras text-base text-encre">{raison.titre}</Text>
            <Text className="font-texte text-sm text-gris">{raison.detail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
        </Pressable>
      ))}
    </View>
  );
}
