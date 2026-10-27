import { Pressable, Text, View } from "react-native";

import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";

type Props = {
  valeur: boolean | null;
  erreur: string | null;
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onChanger: (valeur: boolean) => void;
};

export function ChoixCollaborationActus({ valeur, erreur, T, onChanger }: Props) {
  const options = [
    { cle: false, libelle: T.collaborationNon },
    { cle: true, libelle: T.collaborationOui },
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={T.collaborationTitre} className="gap-2">
      <Text className="font-texte-semi text-base text-encre">{T.collaborationTitre}</Text>
      {options.map(({ cle, libelle }) => {
        const choisi = valeur === cle;
        return (
          <Pressable
            key={String(cle)}
            accessibilityRole="radio"
            accessibilityState={{ checked: choisi }}
            onPress={() => onChanger(cle)}
            className={`min-h-12 flex-row items-center gap-3 rounded-2xl border-2 px-4 py-2 active:opacity-80 ${choisi ? "border-encre bg-jaune-clair" : erreur ? "border-rouge-texte bg-carte" : "border-encre bg-carte"}`}
          >
            <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-encre">{choisi ? <View className="h-2.5 w-2.5 rounded-full bg-encre" /> : null}</View>
            <Text className="flex-1 font-texte-semi text-[15px] text-encre">{libelle}</Text>
          </Pressable>
        );
      })}
      <Text className={`font-texte text-sm leading-5 ${erreur ? "text-rouge-texte" : "text-gris"}`}>{erreur ?? T.collaborationAide}</Text>
    </View>
  );
}
