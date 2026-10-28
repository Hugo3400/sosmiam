import { Text, View } from "react-native";

import type { StatutIdee } from "@sos-miam/commun/types/idees";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { NOMS_STATUTS_IDEE_PAR_LANGUE } from "~/contenus/textes-idees";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  statut: StatutIdee;
};

const FONDS: Readonly<Record<StatutIdee, string>> = {
  "en-relecture": "border border-dashed border-gris bg-carte",
  proposee: "bg-ligne",
  "a-l-etude": "bg-jaune-clair",
  prevue: "bg-jaune",
  faite: "bg-nuit",
};

const TEXTES: Readonly<Record<StatutIdee, string>> = {
  "en-relecture": "text-gris",
  proposee: "text-gris",
  "a-l-etude": "text-encre",
  prevue: "text-nuit",
  faite: "text-jaune",
};

export function PastilleStatutIdee({ statut }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const nomsStatuts = utiliserTextes(NOMS_STATUTS_IDEE_PAR_LANGUE);
  return (
    <View accessible accessibilityLabel={TE.statutLu(nomsStatuts[statut])} className={`self-start rounded-full px-2 py-0.5 ${FONDS[statut]}`}>
      <Text className={`font-texte-gras text-[11px] uppercase tracking-wider ${TEXTES[statut]}`}>{nomsStatuts[statut]}</Text>
    </View>
  );
}
