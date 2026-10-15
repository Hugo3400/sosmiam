import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { MOMENTS_CRENEAUX } from "~/contenus/textes-reserver-table";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { grouperCreneauxReservation } from "~/fonctions/reservations/grouper-creneaux-reservation";

type Props = {
  creneaux: readonly string[];
  choisi: string | null;
  onChoisir: (heure: string) => void;
};

export function ChoixCreneauReservation({ creneaux, choisi, onChoisir }: Props) {
  return (
    <View className="gap-4">
      {grouperCreneauxReservation(creneaux).map((groupe) => (
        <View key={groupe.moment} className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-sm">
              {MOMENTS_CRENEAUX[groupe.moment].emoji}
            </Text>
            <Text className="font-texte-semi text-sm text-gris">{MOMENTS_CRENEAUX[groupe.moment].libelle}</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {groupe.creneaux.map((heure) => (
              <Pastille
                key={heure}
                role="radio"
                libelle={formaterHeure(heure)}
                choisi={heure === choisi}
                position={creneaux.indexOf(heure) + 1}
                total={creneaux.length}
                onPress={() => onChoisir(heure)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
