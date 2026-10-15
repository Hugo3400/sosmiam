import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { PublicSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { decrirePublicSortie } from "~/fonctions/miamis/decrire-public-sortie";
import couleurs from "~/theme/couleurs";

type Props = {
  publicSortie: PublicSortieMiamis;
};

export function BadgePublicSortie({ publicSortie }: Props) {
  const { nom, quiVoit } = decrirePublicSortie(publicSortie);
  if (!quiVoit) return null;
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-lg bg-encre px-2.5 py-1">
      <Ionicons name="lock-closed" size={12} color={couleurs.jaune} />
      <Text className="font-texte-gras text-xs text-jaune">{`${nom} · ${quiVoit}`}</Text>
    </View>
  );
}
