import { Text, View } from "react-native";

import type { ReponseLieuActus } from "@sos-miam/commun/types/actus";

type Props = { reponse: ReponseLieuActus; titre: string; mention: string };

export function MotDuLieu({ reponse, titre, mention }: Props) {
  return (
    <View className="gap-2 rounded-[18px] border-2 border-encre bg-jaune-clair p-4">
      <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
        {titre}
      </Text>
      <Text className="font-texte text-[15px] leading-6 text-encre">{reponse.texte}</Text>
      <Text className="font-texte text-xs text-gris">{mention}</Text>
    </View>
  );
}
