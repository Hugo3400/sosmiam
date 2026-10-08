import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { autresZones, villesLancement } from "~/contenus/inscription/villes";

type Props = {
  /** Ville ou zone choisie, ou null */
  valeur: string | null;
  onChangeVille: (ville: string) => void;
};

/** Choix de la ville : un seul choix parmi les villes de lancement, ou une zone plus large. */
export function ChoixVille({ valeur, onChangeVille }: Props) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-semi text-base text-encre">
          Ta ville
        </Text>
        <Text className="font-texte text-sm leading-5 text-gris">Pour te montrer les bons plans près de chez toi. Un seul choix.</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {villesLancement.map((ville) => (
          <Pastille key={ville} role="radio" libelle={ville} choisi={valeur === ville} onPress={() => onChangeVille(ville)} />
        ))}
      </View>

      <Text className="mt-1 font-texte text-sm text-gris">{"Pas dans la liste\u00a0? Pas de panique\u00a0:"}</Text>
      <View className="flex-row flex-wrap gap-2">
        {autresZones.map((zone) => (
          <Pastille key={zone} role="radio" libelle={zone} choisi={valeur === zone} onPress={() => onChangeVille(zone)} />
        ))}
      </View>
    </View>
  );
}
