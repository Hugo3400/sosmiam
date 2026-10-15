import { Text, View } from "react-native";

import { Pastille } from "~/composants/interface/Pastille";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type ApercuReservations = "exemples" | "vide";

type Props = {
  apercu: ApercuReservations;
  onChoisir: (apercu: ApercuReservations) => void;
};

export function PanneauApercuReservations({ apercu, onChoisir }: Props) {
  return (
    <View className="gap-3 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-3">
      <Text className="font-texte text-[13px] leading-5 text-gris">
        <Text className="font-texte-gras text-encre">🧪 Aperçu</Text>
        {lierPonctuation(" : des réservations d'exemple, rien ne part au lieu. Toucher un choix remet tout à zéro.")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Pastille role="radio" libelle="Avec des réservations" choisi={apercu === "exemples"} position={1} total={2} onPress={() => onChoisir("exemples")} />
        <Pastille role="radio" libelle="Rien de prévu" choisi={apercu === "vide"} position={2} total={2} onPress={() => onChoisir("vide")} />
      </View>
    </View>
  );
}
