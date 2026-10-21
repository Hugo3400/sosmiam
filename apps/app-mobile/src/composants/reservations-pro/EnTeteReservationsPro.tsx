import { Pressable, Text, View } from "react-native";

import type { ModeAcceptationReservation } from "@sos-miam/commun/types/reglages-reservations";
import { TEXTES_COMPTOIR_RESERVATIONS as T } from "~/contenus/textes-comptoir-reservations";
import { MODES_ACCEPTATION } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  acceptation: ModeAcceptationReservation;
  gerant: boolean;
  onReglages: () => void;
};

export function EnTeteReservationsPro({ acceptation, gerant, onReglages }: Props) {
  const mode = MODES_ACCEPTATION[acceptation];
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View accessible accessibilityLabel={mode.etiquetteLue} className="rounded-full border-2 border-encre bg-jaune-clair px-3 py-1.5">
          <Text className="font-texte-gras text-[14px] text-encre">{mode.etiquette}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={gerant ? T.changerIndice : T.voirReglagesIndice}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            onReglages();
          }}
          className="min-h-11 justify-center px-1 active:opacity-60"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">{gerant ? T.changer : T.voirReglages}</Text>
        </Pressable>
      </View>
      {acceptation === "automatique" ? (
        <Text className="rounded-2xl border-2 border-encre bg-jaune-clair px-4 py-3 font-texte text-sm leading-5 text-encre">{lierPonctuation(T.bandeauAuto)}</Text>
      ) : null}
    </View>
  );
}
