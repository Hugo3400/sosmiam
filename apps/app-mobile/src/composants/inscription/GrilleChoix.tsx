import { View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import type { ChoixEnvie } from "~/contenus/inscription/envies";

type Props = {
  choix: ChoixEnvie[];
  coches: string[];
  onBasculer: (id: string) => void;
};

/** Les choix d'une catégorie d'envies, en pastilles qui passent à la ligne. Plusieurs choix possibles. */
export function GrilleChoix({ choix, coches, onBasculer }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {choix.map((c) => (
        <Pastille key={c.id} libelle={c.libelle} emoji={c.emoji} choisi={coches.includes(c.id)} onPress={() => onBasculer(c.id)} />
      ))}
    </View>
  );
}
