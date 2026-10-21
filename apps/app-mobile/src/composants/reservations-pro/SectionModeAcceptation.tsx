import { Text, View } from "react-native";

import { MODES_ACCEPTATION_RESERVATION } from "@sos-miam/commun/regles/reglages-reservations";
import type { ModeAcceptationReservation } from "@sos-miam/commun/types/reglages-reservations";
import { CarteModeAcceptation } from "~/composants/reservations-pro/CarteModeAcceptation";
import { TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  acceptation: ModeAcceptationReservation;
  avecServices: boolean;
  modifiable: boolean;
  onChoisir: (acceptation: ModeAcceptationReservation) => void;
};

const ORDRE: readonly ModeAcceptationReservation[] = [...MODES_ACCEPTATION_RESERVATION].reverse();

export function SectionModeAcceptation({ acceptation, avecServices, modifiable, onChoisir }: Props) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {lierPonctuation(T.modeTitre)}
      </Text>
      <View accessibilityRole="radiogroup" className="gap-3">
        {ORDRE.map((mode, i) => (
          <CarteModeAcceptation
            key={mode}
            mode={mode}
            choisi={acceptation === mode}
            desactive={!modifiable || (mode === "automatique" && !avecServices)}
            indiceDesactive={modifiable ? T.modeAutoSansServices : T.gerantTitre}
            position={i + 1}
            total={ORDRE.length}
            onPress={() => onChoisir(mode)}
          />
        ))}
      </View>
      {!avecServices && modifiable ? <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(T.modeAutoSansServices)}</Text> : null}
      <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.modeCommun)}</Text>
    </View>
  );
}
