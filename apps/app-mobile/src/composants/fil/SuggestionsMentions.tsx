import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  potes: Pote[];
  onChoisir: (pote: Pote) => void;
};

/** Tes potes à mentionner, proposés au-dessus du champ quand tu tapes « @ ». */
export function SuggestionsMentions({ potes, onChoisir }: Props) {
  return (
    <View className="mb-2 overflow-hidden rounded-2xl border-2 border-encre bg-white">
      {potes.map((pote, index) => (
        <Pressable
          key={pote.id}
          accessibilityRole="button"
          accessibilityLabel={`Mentionner ${pote.prenom}, @${pote.pseudo}`}
          onPress={() => {
            vibrerLegerement();
            onChoisir(pote);
          }}
          className={`min-h-11 flex-row items-center gap-3 px-3 py-1.5 active:bg-jaune-clair ${index > 0 ? "border-t border-ligne" : ""}`}
        >
          <RondPote pote={pote} taille={30} />
          <Text numberOfLines={1} className="shrink font-texte-gras text-[15px] text-encre">
            {pote.prenom}
          </Text>
          <Text numberOfLines={1} className="shrink font-texte text-sm text-gris">
            @{pote.pseudo}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
