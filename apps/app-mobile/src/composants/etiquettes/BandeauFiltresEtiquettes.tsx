import { Platform, Pressable, ScrollView, Text } from "react-native";

import { ETIQUETTES_FILTRE_EXPLORER } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  choisie: string | null;
  onChoisir: (nom: string | null) => void;
};

const TOUT = "Tout";

export function BandeauFiltresEtiquettes({ choisie, onChoisir }: Props) {
  const ios = Platform.OS === "ios";
  const noms = [TOUT, ...ETIQUETTES_FILTRE_EXPLORER];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Filtrer les lieux par étiquette"
      contentContainerClassName="gap-2 px-5"
      keyboardShouldPersistTaps="handled"
    >
      {noms.map((nom, i) => {
        const actif = nom === TOUT ? choisie === null : nom === choisie;
        return (
          <Pressable
            key={nom}
            accessibilityRole={ios ? "button" : "radio"}
            accessibilityState={ios ? { selected: actif } : { checked: actif }}
            accessibilityLabel={ios ? `${nom}, ${i + 1} sur ${noms.length}` : nom}
            onPress={() => {
              vibrerLegerement();
              onChoisir(nom === TOUT ? null : nom);
            }}
            className={`min-h-11 justify-center rounded-full border-2 px-4 active:opacity-80 ${actif ? "border-encre bg-encre" : "border-ligne bg-white"}`}
          >
            <Text className={`font-texte-semi text-[13px] ${actif ? "text-creme" : "text-encre"}`}>{nom}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
