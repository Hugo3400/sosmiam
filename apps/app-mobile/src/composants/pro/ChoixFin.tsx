import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import type { ChoixFin as Choix } from "~/fonctions/pro/lister-fins-ce-soir";

type Props = {
  libelle: string;
  choix: Choix[];
  /** La clé du choix retenu */
  choisi: string | null;
  onChoisir: (cle: string) => void;
};

/** Jusqu'à quand (SOS du soir, message du moment) : des pastilles, une seule retenue. */
export function ChoixFin({ libelle, choix, choisi, onChoisir }: Props) {
  return (
    <View className="gap-2">
      <Text className="font-texte-gras text-base text-encre">{libelle}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {choix.map((c, i) => (
          <Pastille key={c.cle} libelle={c.libelle} role="radio" choisi={choisi === c.cle} onPress={() => onChoisir(c.cle)} position={i + 1} total={choix.length} />
        ))}
      </View>
    </View>
  );
}
