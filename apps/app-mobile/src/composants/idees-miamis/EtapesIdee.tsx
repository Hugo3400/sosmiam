import { Text, View } from "react-native";

import { ETAPES_IDEE } from "@sos-miam/commun/regles/idees";
import type { StatutIdee } from "@sos-miam/commun/types/idees";
import { NOMS_STATUTS_IDEE, TEXTES_IDEES } from "~/contenus/textes-idees";

type Props = {
  statut: StatutIdee;
};

export function EtapesIdee({ statut }: Props) {
  const actuelle = ETAPES_IDEE.indexOf(statut);
  const lu = `${TEXTES_IDEES.ouEnEst} : ${ETAPES_IDEE.map((e, rang) => TEXTES_IDEES.etape(NOMS_STATUTS_IDEE[e], rang <= actuelle, rang === actuelle)).join(", ")}`;
  return (
    <View accessible accessibilityLabel={lu} className="flex-row gap-1.5">
      {ETAPES_IDEE.map((etape, rang) => (
        <View key={etape} className="flex-1 gap-1.5">
          <View className={`h-1.5 rounded-full ${rang <= actuelle ? "bg-encre" : "bg-ligne"}`} />
          <Text className={`text-[11px] ${rang === actuelle ? "font-texte-gras" : "font-texte-moyen"} ${rang <= actuelle ? "text-encre" : "text-gris"}`}>
            {NOMS_STATUTS_IDEE[etape]}
          </Text>
        </View>
      ))}
    </View>
  );
}
