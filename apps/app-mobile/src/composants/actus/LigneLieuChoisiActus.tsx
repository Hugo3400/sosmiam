import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  lieu: LieuCiteActus;
  rang: number | null;
  peutMonter: boolean;
  peutDescendre: boolean;
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
};

export function LigneLieuChoisiActus({ lieu, rang, peutMonter, peutDescendre, T, onMonter, onDescendre, onRetirer }: Props) {
  const couleurs = utiliserCouleurs();
  const bouton = "h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80";
  return (
    <View className="flex-row items-center gap-2 rounded-2xl border-2 border-encre bg-carte p-2.5">
      <Text className="text-2xl">{lieu.emoji}</Text>
      <View accessible className="flex-1">
        <Text className="font-texte-gras text-[15px] text-encre">{rang ? `${rang}. ${lieu.nom}` : lieu.nom}</Text>
        <Text className="font-texte text-[13px] text-gris">{`${lieu.quartier} · ${lieu.ville}`}</Text>
      </View>
      {peutMonter ? (
        <Pressable accessibilityRole="button" accessibilityLabel={T.monter(lieu.nom)} onPress={onMonter} className={bouton}>
          <Ionicons name="arrow-up" size={18} color={couleurs.encre} />
        </Pressable>
      ) : null}
      {peutDescendre ? (
        <Pressable accessibilityRole="button" accessibilityLabel={T.descendre(lieu.nom)} onPress={onDescendre} className={bouton}>
          <Ionicons name="arrow-down" size={18} color={couleurs.encre} />
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={T.retirer(lieu.nom)} onPress={onRetirer} className={bouton}>
        <Ionicons name="close" size={18} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
