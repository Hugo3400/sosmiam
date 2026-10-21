import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_ESPACE_COMMUNAUTE } from "~/contenus/textes-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type EspaceCommunaute = "bande" | "miamis";

type Props = {
  espace: EspaceCommunaute;
  onChoisir: (espace: EspaceCommunaute) => void;
};

const ESPACES: { cle: EspaceCommunaute; nom: string }[] = [
  { cle: "bande", nom: TEXTES_ESPACE_COMMUNAUTE.bande },
  { cle: "miamis", nom: TEXTES_ESPACE_COMMUNAUTE.miamis },
];

export function SelecteurEspaceCommunaute({ espace, onChoisir }: Props) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={TEXTES_ESPACE_COMMUNAUTE.choisir} className="flex-row gap-1 rounded-2xl border-2 border-encre bg-white p-1">
      {ESPACES.map((e, i) => {
        const actif = e.cle === espace;
        return (
          <Pressable
            key={e.cle}
            accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
            accessibilityLabel={Platform.OS === "ios" ? `${e.nom}, onglet ${i + 1} sur ${ESPACES.length}` : e.nom}
            accessibilityState={{ selected: actif }}
            onPress={() => {
              if (actif) return;
              vibrerLegerement();
              onChoisir(e.cle);
            }}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl active:opacity-80 ${actif ? "bg-jaune" : ""}`}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={`text-[15px] ${actif ? "font-texte-gras text-encre" : "font-texte-semi text-gris"}`}>{e.nom}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
