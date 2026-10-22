import { Text, View } from "react-native";

import type { MiamSafeLieu } from "@sos-miam/commun/types/miam-safe";

type Props = { miamSafe: MiamSafeLieu };

export function BadgesMiamSafe({ miamSafe }: Props) {
  if (!miamSafe.engage && !miamSafe.repere) return null;
  return (
    <>
      {miamSafe.engage ? (
        <View
          accessible
          accessibilityLabel="Lieu Miam Safe : son équipe sait quoi faire si tu ne te sens pas en sécurité"
          className="flex-row items-center self-start rounded-full border-2 border-encre bg-jaune px-3 py-1"
        >
          <Text className="font-texte-gras text-[13px] text-nuit">🛡️ Miam Safe</Text>
        </View>
      ) : null}
      {miamSafe.repere ? (
        <View accessible accessibilityLabel="Les Miamis s'y sentent bien" className="flex-row items-center self-start rounded-full bg-jaune-clair px-3 py-1">
          <Text className="font-texte-gras text-[13px] text-encre">Les Miamis s'y sentent bien</Text>
        </View>
      ) : null}
    </>
  );
}
