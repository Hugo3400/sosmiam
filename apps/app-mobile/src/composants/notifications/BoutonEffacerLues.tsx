import { useState } from "react";
import { Pressable, Text } from "react-native";

import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { TEXTES_NOTIFICATIONS_PAR_LANGUE } from "~/contenus/textes-notifications";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nombre: number;
  onEffacer: () => void;
  onRefermee: () => void;
};

export function BoutonEffacerLues({ nombre, onEffacer, onRefermee }: Props) {
  const T = utiliserTextes(TEXTES_NOTIFICATIONS_PAR_LANGUE);
  const [ouverte, setOuverte] = useState(false);
  const [nombreAffiche, setNombreAffiche] = useState(nombre);

  return (
    <>
      {nombre > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.effacerLuesLu(nombre)}
          accessibilityHint={T.effacerLuesIndice}
          hitSlop={6}
          onPress={() => {
            vibrerLegerement();
            setNombreAffiche(nombre);
            setOuverte(true);
          }}
          className="h-9 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-carte px-3 active:opacity-70"
        >
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-sm">
            🧹
          </Text>
          <Text className="font-texte-gras text-[13px] text-encre">{T.effacerLues}</Text>
        </Pressable>
      ) : null}
      <FeuilleConfirmation
        visible={ouverte}
        emoji="🧹"
        titre={T.balaiTitre}
        detail={T.effacerLuesDetail(nombreAffiche)}
        libelleConfirmer={T.balayer}
        libelleRester={T.garderTout}
        indiceRester={T.garderToutIndice}
        onConfirmer={onEffacer}
        onRefermee={onRefermee}
        onFermer={() => setOuverte(false)}
      />
    </>
  );
}
