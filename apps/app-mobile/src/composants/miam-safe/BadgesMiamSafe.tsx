import { Text, View } from "react-native";

import type { MiamSafeLieu } from "~/fonctions/miam-safe/lire-miam-safe-lieu";

type Props = { miamSafe: MiamSafeLieu };

/**
 * Sur la fiche, dans la rangée des badges : « Miam Safe » (le lieu a signé la charte) et « Les Miamis s'y sentent bien ».
 * Rien de négatif ne s'affiche jamais : un « non » devient un signalement privé.
 */
export function BadgesMiamSafe({ miamSafe }: Props) {
  if (!miamSafe.engage) return null;
  return (
    <>
      <View
        accessible
        accessibilityLabel="Lieu Miam Safe : son équipe sait quoi faire si tu ne te sens pas en sécurité"
        className="flex-row items-center self-start rounded-full border-2 border-encre bg-jaune px-3 py-1"
      >
        <Text className="font-texte-gras text-[13px] text-encre">🛡 Miam Safe</Text>
      </View>
      {miamSafe.repere ? (
        <View accessible accessibilityLabel="Les Miamis s'y sentent bien" className="flex-row items-center self-start rounded-full bg-jaune-clair px-3 py-1">
          <Text className="font-texte-gras text-[13px] text-encre">Les Miamis s'y sentent bien</Text>
        </View>
      ) : null}
    </>
  );
}
