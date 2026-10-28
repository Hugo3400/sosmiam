import { Text, View } from "react-native";

import type { MiamSafeLieu } from "@sos-miam/commun/types/miam-safe";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { miamSafe: MiamSafeLieu };

export function BadgesMiamSafe({ miamSafe }: Props) {
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  if (!miamSafe.engage && !miamSafe.repere) return null;
  return (
    <>
      {miamSafe.engage ? (
        <View
          accessible
          accessibilityLabel={T.engageLu}
          className="flex-row items-center self-start rounded-full border-2 border-encre bg-jaune px-3 py-1"
        >
          <Text className="font-texte-gras text-[13px] text-nuit">{T.badge}</Text>
        </View>
      ) : null}
      {miamSafe.repere ? (
        <View accessible accessibilityLabel={T.repere} className="flex-row items-center self-start rounded-full bg-jaune-clair px-3 py-1">
          <Text className="font-texte-gras text-[13px] text-encre">{T.repere}</Text>
        </View>
      ) : null}
    </>
  );
}
