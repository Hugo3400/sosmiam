import { Pressable, Text, View } from "react-native";

import type { FamilleEtiquettesOfficielles } from "@sos-miam/commun/types/etiquette";
import { ChevronPliable } from "~/composants/interface/ChevronPliable";
import { FamilleEtiquettesACocher } from "~/composants/miamis/FamilleEtiquettesACocher";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  famille: FamilleEtiquettesOfficielles;
  ouverte: boolean;
  onOuvrir: () => void;
  choisies: readonly string[];
  onBasculer: (nom: string) => void;
  plein: boolean;
};

export function FamilleEtiquettesDepliable({ famille, ouverte, onOuvrir, choisies, onBasculer, plein }: Props) {
  const dedans = famille.etiquettes.filter((nom) => choisies.includes(nom));
  const resume = dedans.length > 0 ? `${dedans.length} choisie${dedans.length > 1 ? "s" : ""} : ${dedans.join(", ")}` : `${famille.etiquettes.length} étiquettes`;
  return (
    <View className="overflow-hidden rounded-2xl border-2 border-encre bg-carte">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${famille.nom}, ${resume}`}
        accessibilityState={{ expanded: ouverte }}
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        className="min-h-14 flex-row items-center gap-3 px-4 py-2 active:opacity-80"
      >
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-[15px] text-encre">{famille.nom}</Text>
          <Text numberOfLines={1} className="font-texte text-xs text-gris">
            {resume}
          </Text>
        </View>
        <ChevronPliable deplie={ouverte} />
      </Pressable>
      {ouverte ? (
        <View className="px-4 pb-4">
          <FamilleEtiquettesACocher famille={famille} choisies={choisies} onBasculer={onBasculer} plein={plein} sansTitre />
        </View>
      ) : null}
    </View>
  );
}
