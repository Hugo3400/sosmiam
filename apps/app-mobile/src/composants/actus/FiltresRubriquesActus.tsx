import { Pressable, ScrollView, Text } from "react-native";

import { RUBRIQUES_ACTUS, type RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";

type Props = { choisie: RubriqueActus | null; onChoisir: (rubrique: RubriqueActus | null) => void; T: Traduction<typeof TEXTES_ACTUS> };

const CHOIX: readonly (RubriqueActus | null)[] = [null, ...RUBRIQUES_ACTUS];

export function FiltresRubriquesActus({ choisie, onChoisir, T }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={T.filtresLu}
      contentContainerClassName="gap-2 px-4 pb-2.5 pt-1.5"
    >
      {CHOIX.map((rubrique) => {
        const actif = rubrique === choisie;
        return (
          <Pressable
            key={rubrique ?? "tout"}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => onChoisir(rubrique)}
            className={`min-h-11 justify-center rounded-full border-2 border-encre px-3.5 active:opacity-80 ${actif ? "bg-choix" : "bg-carte"}`}
          >
            <Text maxFontSizeMultiplier={1.4} className={`text-[13px] ${actif ? "font-texte-gras text-sur-choix" : "font-texte-semi text-encre"}`}>
              {rubrique ? T.filtres[rubrique] : T.filtres.tout}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
