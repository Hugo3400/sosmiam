import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  titre: string;
  texte: string;
  choisi: boolean;
  onPress: () => void;
  position: number;
  total: number;
  desactive?: boolean;
};

export function CarteChoixRadio({ titre, texte, choisi, onPress, position, total, desactive = false }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const ios = Platform.OS === "ios";
  return (
    <Pressable
      accessibilityRole={ios ? "button" : "radio"}
      accessibilityState={ios ? { selected: choisi, disabled: desactive } : { checked: choisi, disabled: desactive }}
      accessibilityLabel={ios ? `${titre}, ${TE.surTotal(position, total)}` : titre}
      accessibilityHint={texte}
      disabled={desactive}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`flex-row items-start gap-3 rounded-2xl p-4 active:opacity-80 ${choisi ? "border-2 border-encre bg-carte" : "border-2 border-ligne bg-transparent"} ${desactive ? "opacity-40" : ""}`}
    >
      <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-encre">
        {choisi ? <View className="h-3 w-3 rounded-full bg-encre" /> : null}
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-titre-gras text-lg text-encre">{titre}</Text>
        <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(texte)}</Text>
      </View>
    </Pressable>
  );
}
