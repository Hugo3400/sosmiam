import { Text, View } from "react-native";

import { ARRIVEE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { formaterCodeLu } from "~/fonctions/visites/formater-code-lu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  code: string;
};

export function CodeArriveeReservation({ code }: Props) {
  const T = utiliserTextes(ARRIVEE_RESERVATION_PAR_LANGUE);
  return (
    <View accessible accessibilityLabel={T.codeLu(formaterCodeLu(code))} className="flex-row items-center gap-3">
      <Text className="font-texte-semi text-sm text-gris">{T.code}</Text>
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
