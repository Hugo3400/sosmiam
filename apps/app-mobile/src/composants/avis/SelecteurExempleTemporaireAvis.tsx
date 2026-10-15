import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { CAS_EXEMPLES_DONNER_AVIS, EXEMPLES_TEMPORAIRES_DONNER_AVIS, type CasExempleDonnerAvis } from "~/contenus/donner-avis-exemples-temporaires";

type Props = {
  cas: CasExempleDonnerAvis;
  onChoisir: (cas: CasExempleDonnerAvis) => void;
};

export function SelecteurExempleTemporaireAvis({ cas, onChoisir }: Props) {
  return (
    <View className="gap-3 self-stretch rounded-carte border-2 border-dashed border-gris/40 p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-sm text-gris">
        {"🧪 Exemples de l'écran (temporaire, avant le branchement)"}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {CAS_EXEMPLES_DONNER_AVIS.map((valeur, index) => (
          <Pastille
            key={valeur}
            libelle={EXEMPLES_TEMPORAIRES_DONNER_AVIS[valeur].libelle}
            choisi={valeur === cas}
            role="radio"
            position={index + 1}
            total={CAS_EXEMPLES_DONNER_AVIS.length}
            onPress={() => onChoisir(valeur)}
          />
        ))}
      </View>
    </View>
  );
}
