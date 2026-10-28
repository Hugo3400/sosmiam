import { View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  jours: readonly number[];
  onChanger: (jours: number[]) => void;
  desactive?: boolean;
};

const JOURS = [1, 2, 3, 4, 5, 6, 0] as const;

export function ChoixJoursSemaine({ jours, onChanger, desactive = false }: Props) {
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);
  const basculer = (numero: number) => {
    const suivants = jours.includes(numero) ? jours.filter((j) => j !== numero) : [...jours, numero];
    onChanger([...suivants].sort((a, b) => a - b));
  };
  return (
    <View className="flex-row flex-wrap gap-2">
      {JOURS.map((numero, i) => (
        <Pastille
          key={numero}
          libelle={T.joursCourts[numero]}
          libelleLu={T.joursLongs[numero]}
          choisi={jours.includes(numero)}
          position={i + 1}
          total={JOURS.length}
          desactive={desactive}
          onPress={() => basculer(numero)}
        />
      ))}
    </View>
  );
}
