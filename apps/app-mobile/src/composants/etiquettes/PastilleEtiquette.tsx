import { Text, View } from "react-native";

import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import { decrireEtiquetteLieu } from "~/fonctions/etiquettes/decrire-etiquette-lieu";

type Props = { etiquette: EtiquetteLieu };

export function PastilleEtiquette({ etiquette }: Props) {
  const { texte, libelleLu } = decrireEtiquetteLieu(etiquette);
  const style =
    etiquette.statut === "confirmee"
      ? "border-jaune-clair bg-jaune-clair"
      : etiquette.parToi
        ? "border-dashed border-encre bg-jaune"
        : "border-dashed border-gris bg-white";
  return (
    <View accessible accessibilityLabel={libelleLu} className={`rounded-full border-[1.5px] px-3 py-1 ${style}`}>
      <Text className="font-texte-semi text-xs text-encre">{texte}</Text>
    </View>
  );
}
