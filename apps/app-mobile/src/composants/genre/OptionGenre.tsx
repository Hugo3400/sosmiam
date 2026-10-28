import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_GENRE_PAR_LANGUE } from "~/contenus/textes-genre";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nom: string;
  effet: string;
  choisi: boolean;
  desactive: boolean;
  position: number;
  total: number;
  onPress: () => void;
};

export function OptionGenre({ nom, effet, choisi, desactive, position, total, onPress }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_GENRE_PAR_LANGUE);
  const ios = Platform.OS === "ios";
  const place = ios ? `, ${TE.surTotal(position, total)}` : "";
  return (
    <Pressable
      accessibilityRole={ios ? "button" : "radio"}
      accessibilityState={ios ? { selected: choisi, disabled: desactive } : { checked: choisi, disabled: desactive }}
      accessibilityLabel={`${nom}, ${effet}${place}`}
      accessibilityHint={desactive ? T.indisponible : undefined}
      disabled={desactive}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-14 flex-row items-center gap-3 rounded-2xl px-3.5 py-3 active:opacity-80 ${choisi ? "border-2 border-encre bg-carte" : "border border-ligne"} ${desactive ? "opacity-50" : ""}`}
    >
      <View className="h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-encre">
        <View className={`h-3 w-3 rounded-full ${choisi ? "bg-jaune" : ""}`} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-gras text-base text-encre">{nom}</Text>
        <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(effet)}</Text>
      </View>
    </Pressable>
  );
}
