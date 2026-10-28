import { Pressable, ScrollView, Text } from "react-native";

import { FILTRES_IDEES, FILTRES_IDEES_PAR_LANGUE, TEXTES_IDEES_PAR_LANGUE, type FiltreIdees } from "~/contenus/textes-idees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  filtre: FiltreIdees;
  onChoisir: (filtre: FiltreIdees) => void;
};

export function FiltresIdees({ filtre, onChoisir }: Props) {
  const nomsFiltres = utiliserTextes(FILTRES_IDEES_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={T.filtres}
      className="-mx-5"
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {FILTRES_IDEES.map((f, rang) => {
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
            className={`min-h-10 justify-center rounded-full px-4 active:opacity-80 ${actif ? "border border-encre bg-choix" : "border border-ligne bg-carte"}`}
          >
            <Text className={`font-texte-semi text-[13px] ${actif ? "text-sur-choix" : "text-encre"}`}>{nomsFiltres[rang].nom}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
