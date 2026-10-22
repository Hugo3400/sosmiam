import { Text, View } from "react-native";

import { formaterCodeLu } from "~/fonctions/visites/formater-code-lu";

type Props = {
  code: string;
};

export function CodeArriveeReservation({ code }: Props) {
  return (
    <View accessible accessibilityLabel={`Ton code d'arrivée : ${formaterCodeLu(code)}`} className="flex-row items-center gap-3">
      <Text className="font-texte-semi text-sm text-gris">{"Ton code d'arrivée"}</Text>
      <View className="flex-row gap-1">
        {Array.from(code).map((chiffre, i) => (
          <View key={`${i}-${chiffre}`} className="h-9 w-8 items-center justify-center rounded-lg border-2 border-encre bg-jaune">
            <Text maxFontSizeMultiplier={1.2} className="font-titre text-lg text-nuit">
              {chiffre}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
