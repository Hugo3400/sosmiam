import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_MESSAGES } from "~/contenus/textes-messages";
import { TEXTES_ESPACE_COMMUNAUTE } from "~/contenus/textes-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type EspaceCommunaute = "messages" | "bande" | "miamis";

type Props = {
  espace: EspaceCommunaute;
  onChoisir: (espace: EspaceCommunaute) => void;
  nonLus: number;
};

const ESPACES: { cle: EspaceCommunaute; nom: string }[] = [
  { cle: "messages", nom: TEXTES_ESPACE_COMMUNAUTE.messages },
  { cle: "bande", nom: TEXTES_ESPACE_COMMUNAUTE.bande },
  { cle: "miamis", nom: TEXTES_ESPACE_COMMUNAUTE.miamis },
];

export function SelecteurEspaceCommunaute({ espace, onChoisir, nonLus }: Props) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={TEXTES_ESPACE_COMMUNAUTE.choisir} className="flex-row gap-1 rounded-2xl border-2 border-encre bg-carte p-1">
      {ESPACES.map((e, i) => {
        const actif = e.cle === espace;
        const pastille = e.cle === "messages" && nonLus > 0 ? (nonLus > 99 ? "99+" : String(nonLus)) : null;
        const lu = pastille ? `${e.nom}, ${TEXTES_MESSAGES.nonLus(nonLus)}` : e.nom;
        return (
          <Pressable
            key={e.cle}
            accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
            accessibilityLabel={Platform.OS === "ios" ? `${lu}, onglet ${i + 1} sur ${ESPACES.length}` : lu}
            accessibilityState={{ selected: actif }}
            onPress={() => {
              if (actif) return;
              vibrerLegerement();
              onChoisir(e.cle);
            }}
            className={`min-h-11 flex-row items-center justify-center gap-1 rounded-xl px-0.5 active:opacity-80 ${e.cle === "messages" ? "flex-[1.15]" : "flex-1"} ${actif ? "bg-jaune" : ""}`}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={`shrink text-[15px] ${actif ? "font-texte-gras text-nuit" : "font-texte-semi text-gris"}`}>{e.nom}</Text>
            {pastille ? (
              <View className="min-w-5 items-center rounded-full bg-rouge-sos px-1.5 py-0.5">
                <Text allowFontScaling={false} className="font-texte-gras text-[11px] text-white">
                  {pastille}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
