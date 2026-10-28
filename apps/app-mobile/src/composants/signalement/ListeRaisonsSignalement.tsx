import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { RAISONS_SIGNALEMENT_PAR_LANGUE, raisonsSignalement, type ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  onChoisir: (raison: ChoixRaisonSignalement) => void;
};

/** Première étape du signalement : pourquoi tu signales (une raison à toucher, qui mène à l'étape suivante). */
export function ListeRaisonsSignalement({ onChoisir }: Props) {
  const couleurs = utiliserCouleurs();
  const raisons = utiliserTextes(RAISONS_SIGNALEMENT_PAR_LANGUE);
  return (
    <View>
      {raisonsSignalement.map((raison, i) => (
        <Pressable
          key={raison.cle}
          accessibilityRole="button"
          accessibilityLabel={raisons[i].titre}
          accessibilityHint={raisons[i].detail}
          onPress={() => {
            vibrerLegerement();
            onChoisir(raison);
          }}
          className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
        >
          <Text className="text-2xl">{raison.emoji}</Text>
          <View className="flex-1">
            <Text className="font-texte-gras text-base text-encre">{raisons[i].titre}</Text>
            <Text className="font-texte text-sm text-gris">{raisons[i].detail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
        </Pressable>
      ))}
    </View>
  );
}
