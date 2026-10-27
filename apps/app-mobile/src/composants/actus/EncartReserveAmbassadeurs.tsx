import { Linking, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";

type Props = { titre: string; texte: string; bouton: string | null; adresse: string };

export function EncartReserveAmbassadeurs({ titre, texte, bouton, adresse }: Props) {
  return (
    <View className="gap-2 rounded-[18px] border-2 border-encre bg-jaune-clair p-4">
      <Text className="font-texte-gras text-[15px] text-encre">{titre}</Text>
      <Text className="font-texte text-sm leading-5 text-encre">{texte}</Text>
      {bouton ? <Bouton libelle={bouton} variante="blanc" petit className="mt-1 self-start" onPress={() => void Linking.openURL(adresse).catch(() => {})} /> : null}
    </View>
  );
}
