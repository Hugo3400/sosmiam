import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  titre: string;
  texte: string;
  libelles: readonly string[];
  choisi: number;
  onChoisir: (index: number) => void;
};

export function PanneauApercuDemandeReservation({ titre, texte, libelles, choisi, onChoisir }: Props) {
  return (
    <View className="gap-3 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-3">
      <Text className="font-texte text-[13px] leading-5 text-gris">
        <Text className="font-texte-gras text-encre">{titre}</Text>
        {lierPonctuation(texte)}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {libelles.map((libelle, index) => (
          <Pastille
            key={libelle}
            role="radio"
            libelle={libelle}
            choisi={index === choisi}
            position={index + 1}
            total={libelles.length}
            onPress={() => onChoisir(index)}
          />
        ))}
      </View>
    </View>
  );
}
