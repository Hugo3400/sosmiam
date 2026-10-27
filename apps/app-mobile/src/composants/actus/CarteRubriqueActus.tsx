import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  rubrique: RubriqueActus;
  nom: string;
  emoji: string;
  description: string;
  lieux: string;
  brouillon: string | null;
  desactive: boolean;
  onChoisir: (rubrique: RubriqueActus) => void;
};

export function CarteRubriqueActus({ rubrique, nom, emoji, description, lieux, brouillon, desactive, onChoisir }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desactive }}
      accessibilityLabel={[nom, description, lieux, brouillon].filter(Boolean).join(". ")}
      disabled={desactive}
      onPress={() => onChoisir(rubrique)}
      className={`flex-row items-center gap-3 rounded-[18px] border-2 border-encre bg-carte p-4 active:opacity-90 ${desactive ? "opacity-50" : ""}`}
    >
      <View className="h-12 w-12 items-center justify-center rounded-xl border-2 border-encre bg-jaune-clair">
        <Text className="text-2xl">{emoji}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre">{nom}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{description}</Text>
        <Text className="font-texte-semi text-[13px] text-encre">{lieux}</Text>
        {brouillon ? <Text className="font-texte-gras text-[13px] text-encre">{`✏️ ${brouillon}`}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.encre} />
    </Pressable>
  );
}
