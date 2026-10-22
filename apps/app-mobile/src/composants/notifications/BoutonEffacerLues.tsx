import { useState } from "react";
import { Pressable, Text } from "react-native";

import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  nombre: number;
  onEffacer: () => void;
  onRefermee: () => void;
};

const decrire = (nombre: number) =>
  nombre > 1
    ? `Les ${nombre} notifications que tu as déjà lues s'envolent. Les nouvelles, elles, restent bien au chaud.`
    : "La notification que tu as déjà lue s'envole. Les nouvelles, elles, restent bien au chaud.";

export function BoutonEffacerLues({ nombre, onEffacer, onRefermee }: Props) {
  const [ouverte, setOuverte] = useState(false);
  const [nombreAffiche, setNombreAffiche] = useState(nombre);

  return (
    <>
      {nombre > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Effacer les lues, ${nombre} notification${nombre > 1 ? "s" : ""}`}
          accessibilityHint="Un petit coup de balai sur ce que tu as déjà vu. On te demande avant."
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
          <Text className="font-texte-gras text-[13px] text-encre">Effacer les lues</Text>
        </Pressable>
      ) : null}
      <FeuilleConfirmation
        visible={ouverte}
        emoji="🧹"
        titre="Un petit coup de balai ?"
        detail={decrire(nombreAffiche)}
        libelleConfirmer="Balayer"
        libelleRester="Je garde tout"
        indiceRester="Tes notifications restent là"
        onConfirmer={onEffacer}
        onRefermee={onRefermee}
        onFermer={() => setOuverte(false)}
      />
    </>
  );
}
