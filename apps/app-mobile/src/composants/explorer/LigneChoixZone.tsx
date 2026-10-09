import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  emoji: string;
  libelle: string;
  /** Petite précision sous le libellé : « Autour de Montpellier », « Occitanie » */
  detail?: string;
  choisi: boolean;
  /** Place dans la liste (à partir de 1) et taille de la liste : dites sur iPhone, où le groupe n'est pas annoncé */
  position: number;
  total: number;
  onPress: () => void;
};

/** Une ligne de « On explore où ? » : emoji, libellé (et précision), rond coché ou non. Au moins 56 points de haut. */
export function LigneChoixZone({ emoji, libelle, detail, choisi, position, total, onPress }: Props) {
  const lu = detail ? `${libelle}, ${detail}` : libelle;
  return (
    <Pressable
      // Sur iPhone, une radio est lue en anglais (« radio button ») : bouton « sélectionné », avec sa place dans la liste
      accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
      accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
      accessibilityLabel={Platform.OS === "ios" ? `${lu}, ${position} sur ${total}` : lu}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-3 active:opacity-70"
    >
      <Text className="text-xl">{emoji}</Text>
      <View className="flex-1">
        <Text className={`text-base text-encre ${choisi ? "font-texte-gras" : "font-texte"}`}>{libelle}</Text>
        {detail ? <Text className="font-texte text-[13px] text-gris">{detail}</Text> : null}
      </View>
      {choisi ? <Ionicons name="checkmark-circle" size={24} color={couleurs.encre} /> : <View className="h-6 w-6 rounded-full border-2 border-ligne" />}
    </Pressable>
  );
}
