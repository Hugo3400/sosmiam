import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { TEXTES_ESPACE_COMMUNAUTE_PAR_LANGUE } from "~/contenus/textes-miamis";
import { TEXTES_ONGLETS_POTES_PAR_LANGUE } from "~/contenus/textes-onglets-potes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type EspaceCommunaute = "messages" | "bande" | "miamis";

type Props = {
  espace: EspaceCommunaute;
  onChoisir: (espace: EspaceCommunaute) => void;
  nonLus: number;
};

const CLES_ESPACES: EspaceCommunaute[] = ["messages", "bande", "miamis"];

export function SelecteurEspaceCommunaute({ espace, onChoisir, nonLus }: Props) {
  const T = utiliserTextes(TEXTES_ESPACE_COMMUNAUTE_PAR_LANGUE);
  const MESSAGES = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const ONGLETS = utiliserTextes(TEXTES_ONGLETS_POTES_PAR_LANGUE).onglets;
  const ESPACES = CLES_ESPACES.map((cle) => ({ cle, nom: T[cle] }));
  return (
    <View accessibilityRole="tablist" accessibilityLabel={T.choisir} className="flex-row gap-1 rounded-2xl border-2 border-encre bg-carte p-1">
      {ESPACES.map((e, i) => {
        const actif = e.cle === espace;
        const pastille = e.cle === "messages" && nonLus > 0 ? (nonLus > 99 ? "99+" : String(nonLus)) : null;
        const lu = pastille ? `${e.nom}, ${MESSAGES.nonLus(nonLus)}` : e.nom;
        return (
          <Pressable
            key={e.cle}
            accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
            accessibilityLabel={Platform.OS === "ios" ? ONGLETS.ongletSur(lu, i + 1, ESPACES.length) : lu}
            accessibilityState={{ selected: actif }}
            onPress={() => {
              if (actif) return;
              vibrerLegerement();
              onChoisir(e.cle);
            }}
            className={`min-h-11 shrink grow flex-row items-center justify-center gap-1 rounded-xl px-0.5 active:opacity-80 ${actif ? "bg-jaune" : ""}`}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={`shrink text-sm ${actif ? "font-texte-gras text-nuit" : "font-texte-semi text-gris"}`}>{e.nom}</Text>
            {pastille ? (
              <View className="min-w-5 items-center rounded-full bg-rouge-sos px-1 py-0.5">
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
