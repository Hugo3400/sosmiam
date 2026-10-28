import { Text, View } from "react-native";

import { ETAPES_IDEE } from "@sos-miam/commun/regles/idees";
import type { StatutIdee } from "@sos-miam/commun/types/idees";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { NOMS_STATUTS_IDEE_PAR_LANGUE, TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  statut: StatutIdee;
};

export function EtapesIdee({ statut }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const nomsStatuts = utiliserTextes(NOMS_STATUTS_IDEE_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const actuelle = ETAPES_IDEE.indexOf(statut);
  const lu = TE.etapesLues(T.ouEnEst, ETAPES_IDEE.map((e, rang) => T.etape(nomsStatuts[e], rang <= actuelle, rang === actuelle)).join(", "));
  return (
    <View accessible accessibilityLabel={lu} className="flex-row gap-1.5">
      {ETAPES_IDEE.map((etape, rang) => (
        <View key={etape} className="flex-1 gap-1.5">
          <View className={`h-1.5 rounded-full ${rang <= actuelle ? "bg-encre" : "bg-ligne"}`} />
          <Text className={`text-[11px] ${rang === actuelle ? "font-texte-gras" : "font-texte-moyen"} ${rang <= actuelle ? "text-encre" : "text-gris"}`}>
            {nomsStatuts[etape]}
          </Text>
        </View>
      ))}
    </View>
  );
}
