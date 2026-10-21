import { View } from "react-native";

import { EntreeFidelite } from "~/composants/profil/EntreeFidelite";
import { EntreeSuivis } from "~/composants/profil/EntreeSuivis";
import { EntreeVisites } from "~/composants/profil/EntreeVisites";
import { EntreeReservations } from "~/composants/reservations/EntreeReservations";

type Props = {
  suivis: readonly string[];
};

export function RaccourcisProfil({ suivis }: Props) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <EntreeReservations />
        <EntreeFidelite />
      </View>
      <View className="flex-row gap-3">
        <EntreeSuivis suivis={suivis} />
        <EntreeVisites />
      </View>
    </View>
  );
}
