import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_SONDAGE as T } from "~/contenus/textes-sondage";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  lieu: Lieu;
  choisi: boolean;
  desactive: boolean;
  onBasculer: () => void;
};

export function LigneLieuSondage({ lieu, choisi, desactive, onBasculer }: Props) {
  const couleurs = utiliserCouleurs();
  const sos = estSosEnCours(lieu);
  const infos = [lieu.info, ecrireQuartierVille(lieu)].filter(Boolean).join(" · ");
  const ios = Platform.OS === "ios";
  return (
    <Pressable
      accessibilityRole={ios ? "button" : "checkbox"}
      accessibilityState={ios ? { selected: choisi, disabled: desactive } : { checked: choisi, disabled: desactive }}
      accessibilityLabel={`${lieu.nom}${sos ? ", SOS ce soir" : ""}, ${infos}`}
      accessibilityHint={desactive ? T.plein : undefined}
      onPress={() => {
        vibrerLegerement();
        onBasculer();
      }}
      className={`min-h-[60px] flex-row items-center gap-3 border-b border-ligne py-1.5 active:opacity-70 ${desactive ? "opacity-40" : ""}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-jaune-clair">
        <Text allowFontScaling={false} style={{ fontSize: 22, lineHeight: 28 }}>
          {lieu.emoji}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink font-texte-gras text-[15px] text-encre">
            {lieu.nom}
          </Text>
          {sos ? (
            <View className="rounded-full border border-nuit bg-jaune px-1.5 py-px">
              <Text className="font-texte-gras text-[11px] text-nuit">SOS</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {infos}
        </Text>
      </View>
      <View className={`h-7 w-7 items-center justify-center rounded-lg border-2 border-encre ${choisi ? "bg-choix" : "bg-carte"}`}>
        {choisi ? <Ionicons name="checkmark" size={18} color={couleurs["sur-choix"]} /> : null}
      </View>
    </Pressable>
  );
}
