import { Pressable, ScrollView, Text } from "react-native";

import { FILTRES_IDEES, TEXTES_IDEES, type FiltreIdees } from "~/contenus/textes-idees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  filtre: FiltreIdees;
  onChoisir: (filtre: FiltreIdees) => void;
};

export function FiltresIdees({ filtre, onChoisir }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={TEXTES_IDEES.filtres}
      className="-mx-5"
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {FILTRES_IDEES.map((f) => {
        const actif = f.id === filtre;
        return (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => {
              if (actif) return;
              vibrerLegerement();
              onChoisir(f.id);
            }}
            className={`min-h-10 justify-center rounded-full px-4 active:opacity-80 ${actif ? "border border-encre bg-nuit" : "border border-ligne bg-carte"}`}
          >
            <Text className={`font-texte-semi text-[13px] ${actif ? "text-lait" : "text-encre"}`}>{f.nom}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
