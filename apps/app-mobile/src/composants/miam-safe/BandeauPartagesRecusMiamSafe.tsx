import { useRouter, type Href } from "expo-router";
import { Pressable, Text } from "react-native";

import { utiliserPartagesRecusMiamSafe } from "~/hooks/utiliser-partages-recus-miam-safe";

type Props = { className?: string };

/**
 * « Prévenir un pote » : un bandeau quand un pote partage sa position avec toi, au cas où la notification n'est pas
 * arrivée (téléphone en silence, notifications coupées…). Un appui ouvre l'écran du partage. Rien quand il n'y en a pas.
 * Ton sérieux : pas de blague. Le parent choisit où le poser (className).
 */
export function BandeauPartagesRecusMiamSafe({ className = "" }: Props) {
  const router = useRouter();
  const recus = utiliserPartagesRecusMiamSafe();
  const premier = recus[0];
  if (!premier) return null;
  const autres = recus.length - 1;
  const texte = `${premier.personne.prenom} ne se sent pas en sécurité et partage ${premier.avecPosition ? "sa position" : "le lieu"} avec toi`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${texte}${autres > 0 ? `, et ${autres} autre${autres > 1 ? "s" : ""}` : ""}. Voir`}
      onPress={() => router.push(`/miam-safe/partage/${premier.id}` as Href)}
      className={`min-h-12 flex-row items-center gap-2 rounded-2xl border-2 border-jaune bg-encre px-4 py-2 active:opacity-80 ${className}`}
    >
      <Text className="text-lg">🛡</Text>
      <Text className="shrink grow font-texte-gras text-sm leading-5 text-creme" numberOfLines={2}>
        {texte}
        {autres > 0 ? ` (+${autres})` : ""}
      </Text>
      <Text className="font-texte-gras text-sm text-jaune">Voir</Text>
    </Pressable>
  );
}
