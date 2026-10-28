import { useRouter, type Href } from "expo-router";
import { Pressable, Text } from "react-native";

import { TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE } from "~/contenus/textes-miam-safe-partage";
import { utiliserPartagesRecusMiamSafe } from "~/hooks/utiliser-partages-recus-miam-safe";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { className?: string };

/**
 * « Prévenir un pote » : un bandeau quand un pote partage sa position avec toi, au cas où la notification n'est pas
 * arrivée (téléphone en silence, notifications coupées…). Un appui ouvre l'écran du partage. Rien quand il n'y en a pas.
 * Ton sérieux : pas de blague. Le parent choisit où le poser (className).
 */
export function BandeauPartagesRecusMiamSafe({ className = "" }: Props) {
  const router = useRouter();
  const recus = utiliserPartagesRecusMiamSafe();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE);
  const premier = recus[0];
  if (!premier) return null;
  const autres = recus.length - 1;
  const texte = T.bandeau(premier.personne.prenom, premier.avecPosition);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.bandeauLu(texte, autres)}
      onPress={() => router.push(`/miam-safe/partage/${premier.id}` as Href)}
      className={`min-h-12 flex-row items-center gap-2 rounded-2xl border-2 border-jaune bg-nuit px-4 py-2 active:opacity-80 ${className}`}
    >
      <Text className="text-lg">🛡️</Text>
      <Text className="shrink grow font-texte-gras text-sm leading-5 text-lait" numberOfLines={2}>
        {texte}
        {autres > 0 ? ` (+${autres})` : ""}
      </Text>
      <Text className="font-texte-gras text-sm text-jaune">{T.voir}</Text>
    </Pressable>
  );
}
