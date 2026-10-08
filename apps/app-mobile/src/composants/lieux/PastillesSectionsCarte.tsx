import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  /** Titres des sections, dans l'ordre de la carte */
  titres: string[];
  /** Section en cours de lecture : mise en avant, et ramenée à l'écran si la rangée a défilé */
  active: number;
  onChoisir: (index: number) => void;
};

/**
 * Rangée de pastilles qui mène aux sections de la carte (« Desserts », « À boire »…). Chacune est un bouton
 * « Desserts, section 3 sur 4 » : le toucher fait défiler la carte et y amène le lecteur d'écran.
 */
export function PastillesSectionsCarte({ titres, active, onChoisir }: Props) {
  const animationsReduites = useReducedMotion();
  const rangee = useRef<ScrollView>(null);
  const positions = useRef<number[]>([]);

  // La pastille de la section lue reste visible, même au bout d'une longue rangée
  useEffect(() => {
    const x = positions.current[active];
    if (x !== undefined) rangee.current?.scrollTo({ x: Math.max(0, x - 20), animated: !animationsReduites });
  }, [active, animationsReduites]);

  return (
    <ScrollView
      ref={rangee}
      horizontal
      showsHorizontalScrollIndicator={false}
      // Sans ça, la rangée s'étirerait en hauteur dans son parent
      style={{ flexGrow: 0 }}
      contentContainerClassName="items-center gap-2 px-5 py-2.5"
    >
      {titres.map((titre, index) => {
        const choisie = index === active;
        return (
          <Pressable
            key={`${index}-${titre}`}
            accessibilityRole="button"
            accessibilityLabel={`${titre}, section ${index + 1} sur ${titres.length}`}
            accessibilityHint="Fait défiler la carte jusqu'à cette section"
            onLayout={(evenement) => {
              positions.current[index] = evenement.nativeEvent.layout.x;
            }}
            onPress={() => {
              vibrerLegerement();
              onChoisir(index);
            }}
            className={`min-h-11 flex-row items-center rounded-full border-2 border-encre px-4 active:opacity-80 ${choisie ? "bg-encre" : "bg-white"}`}
          >
            <Text className={`font-texte-semi text-[15px] ${choisie ? "text-jaune" : "text-encre"}`}>{titre}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
