import { Pressable, Switch, Text, View } from "react-native";

import { TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserCouleursInterrupteur } from "~/hooks/utiliser-couleurs-interrupteur";

type Props = {
  valeur: boolean;
  detail: string;
  enCours: boolean;
  onChanger: (valeur: boolean) => void;
};

export function InterrupteurPresence({ valeur, detail, enCours, onChanger }: Props) {
  const couleurs = utiliserCouleurs();
  const { piste, pastille } = utiliserCouleursInterrupteur();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={TEXTES_QUI_EST_LA.montrer}
      accessibilityHint={enCours ? TEXTES_QUI_EST_LA.enCours : detail}
      accessibilityState={{ checked: valeur, disabled: enCours, busy: enCours }}
      disabled={enCours}
      onPress={() => {
        vibrerLegerement();
        onChanger(!valeur);
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-[18px] border border-ligne bg-carte px-3.5 py-3 active:opacity-80 ${enCours ? "opacity-60" : ""}`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-semi text-sm text-encre">{TEXTES_QUI_EST_LA.montrer}</Text>
        <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(enCours ? TEXTES_QUI_EST_LA.enCours : detail)}</Text>
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value={valeur} trackColor={{ false: couleurs.ligne, true: piste }} ios_backgroundColor={couleurs.ligne} thumbColor={valeur ? pastille : couleurs.gris} />
      </View>
    </Pressable>
  );
}
