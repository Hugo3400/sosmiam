import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_FEUILLE_SERVICE as T } from "~/contenus/textes-reglages-reservations";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  libelle: string;
  valeur: string;
  ouvert: boolean;
  aide?: string;
  erreur?: string | null;
  onBasculer: () => void;
};

export function ChampHeureService({ libelle, valeur, ouvert, aide, erreur, onBasculer }: Props) {
  const message = erreur ?? aide;
  return (
    <View className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${libelle} : ${formaterHeure(valeur)}${erreur ? `. ${erreur}` : ""}`}
        accessibilityHint={T.changerHeureIndice}
        accessibilityState={{ expanded: ouvert }}
        onPress={() => {
          vibrerLegerement();
          onBasculer();
        }}
        className={`min-h-14 flex-row items-center justify-between rounded-2xl border-2 bg-white px-4 py-2 active:opacity-80 ${erreur ? "border-tomate" : "border-encre"}`}
      >
        <Text className="font-texte-semi text-base text-encre">{libelle}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="font-titre text-2xl text-encre">{formaterHeure(valeur)}</Text>
          <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={couleurs.encre} />
        </View>
      </Pressable>
      {message ? <Text className={`font-texte text-[13px] leading-[18px] ${erreur ? "text-rouge-texte" : "text-gris"}`}>{lierPonctuation(message)}</Text> : null}
    </View>
  );
}
