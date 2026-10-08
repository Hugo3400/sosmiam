import { View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ActivitePotes } from "~/composants/potes/ActivitePotes";
import { ClassementPotes } from "~/composants/potes/ClassementPotes";
import { RangeeBande } from "~/composants/potes/RangeeBande";

type Props = {
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
};

/** Onglet « Ma bande » : le classement du mois, ce que font tes potes, puis ta bande et de quoi l'agrandir. */
export function SectionBande({ lieux }: Props) {
  return (
    <View className="gap-8">
      <ClassementPotes />
      <ActivitePotes lieux={lieux} />
      <RangeeBande />
    </View>
  );
}
