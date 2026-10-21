import { View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";

type Props = {
  jours: readonly number[];
  onChanger: (jours: number[]) => void;
  desactive?: boolean;
};

const JOURS = [
  { numero: 1, court: "Lun", long: "lundi" },
  { numero: 2, court: "Mar", long: "mardi" },
  { numero: 3, court: "Mer", long: "mercredi" },
  { numero: 4, court: "Jeu", long: "jeudi" },
  { numero: 5, court: "Ven", long: "vendredi" },
  { numero: 6, court: "Sam", long: "samedi" },
  { numero: 0, court: "Dim", long: "dimanche" },
] as const;

export function ChoixJoursSemaine({ jours, onChanger, desactive = false }: Props) {
  const basculer = (numero: number) => {
    const suivants = jours.includes(numero) ? jours.filter((j) => j !== numero) : [...jours, numero];
    onChanger([...suivants].sort((a, b) => a - b));
  };
  return (
    <View className="flex-row flex-wrap gap-2">
      {JOURS.map((jour, i) => (
        <Pastille
          key={jour.numero}
          libelle={jour.court}
          libelleLu={jour.long}
          choisi={jours.includes(jour.numero)}
          position={i + 1}
          total={JOURS.length}
          desactive={desactive}
          onPress={() => basculer(jour.numero)}
        />
      ))}
    </View>
  );
}
