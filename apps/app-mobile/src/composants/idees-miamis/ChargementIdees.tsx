import { ActivityIndicator, Text, View } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  texte: string;
};

export function ChargementIdees({ texte }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View accessible accessibilityLabel={texte} accessibilityState={{ busy: true }} className="items-center gap-3 px-5 pt-16">
      <ActivityIndicator size="large" color={couleurs.encre} />
      <Text className="font-texte text-base text-gris">{texte}</Text>
    </View>
  );
}
