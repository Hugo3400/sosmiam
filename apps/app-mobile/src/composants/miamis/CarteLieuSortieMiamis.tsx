import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: LieuResume;
};

export function CarteLieuSortieMiamis({ lieu }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lieu.nom}, ${lieu.ville}`}
      accessibilityHint={TE.ouvrirFicheLieu}
      onPress={() => {
        vibrerLegerement();
        router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
      }}
      className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-3 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-jaune-clair">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          {lieu.emoji}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
          {lieu.nom}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {`${T.lieuPublie} · ${lieu.ville} · ${T.ficheLieu}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
