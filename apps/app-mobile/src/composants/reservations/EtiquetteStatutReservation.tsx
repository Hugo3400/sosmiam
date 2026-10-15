import { Text, View } from "react-native";

import type { EtiquetteReservation, TonEtiquetteReservation } from "~/fonctions/reservations/decrire-statut-reservation";

type Props = {
  etiquette: EtiquetteReservation;
};

const FONDS: Record<TonEtiquetteReservation, string> = {
  jaune: "border-encre bg-jaune",
  attente: "border-encre bg-jaune-clair",
  rose: "border-rouge-texte bg-rose-alerte",
  doux: "border-ligne bg-creme",
};

const TEXTES: Record<TonEtiquetteReservation, string> = {
  jaune: "text-encre",
  attente: "text-encre",
  rose: "text-rouge-texte",
  doux: "text-gris",
};

export function EtiquetteStatutReservation({ etiquette }: Props) {
  return (
    <View className={`rounded-full border px-2.5 py-1 ${FONDS[etiquette.ton]}`}>
      <Text className={`font-texte-semi text-[12px] ${TEXTES[etiquette.ton]}`}>{etiquette.texte}</Text>
    </View>
  );
}
