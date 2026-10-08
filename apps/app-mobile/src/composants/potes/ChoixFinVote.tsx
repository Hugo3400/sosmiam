import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

/** Un moment possible pour la fin du vote */
export type OptionFinVote = {
  cle: string;
  /** « Dans 1 h », « Demain, 18h »… */
  libelle: string;
  /** Le moment exact, déjà écrit : « jeudi 9 octobre à 18h » */
  detail: string;
};

type Props = {
  options: OptionFinVote[];
  choisie: string;
  onChoisir: (cle: string) => void;
};

/** Choisir quand le vote d'une nouvelle sortie se termine : un seul choix parmi quelques moments. */
export function ChoixFinVote({ options, choisie, onChoisir }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Fin du vote">
      {options.map((o, i) => {
        const actif = o.cle === choisie;
        return (
          <Pressable
            key={o.cle}
            // Sur iPhone, une radio est lue en anglais : bouton « sélectionné », avec sa place dans la liste ; radio cochée ou non ailleurs
            accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
            accessibilityState={Platform.OS === "ios" ? { selected: actif } : { checked: actif }}
            accessibilityLabel={`${o.libelle}, ${o.detail}${Platform.OS === "ios" ? `, ${i + 1} sur ${options.length}` : ""}`}
            onPress={() => {
              vibrerLegerement();
              onChoisir(o.cle);
            }}
            className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
          >
            <View className="flex-1">
              <Text className={`text-base text-encre ${actif ? "font-texte-gras" : "font-texte"}`}>{o.libelle}</Text>
              <Text className="font-texte text-sm text-gris">{o.detail}</Text>
            </View>
            {actif ? <Ionicons name="checkmark-circle" size={24} color={couleurs.encre} /> : <View className="h-6 w-6 rounded-full border-2 border-ligne" />}
          </Pressable>
        );
      })}
    </View>
  );
}
