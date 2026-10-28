import { Pressable, Switch, Text, View } from "react-native";

import { TEXTES_QUI_EST_LA_PAR_LANGUE } from "~/contenus/textes-qui-est-la";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserCouleursInterrupteur } from "~/hooks/utiliser-couleurs-interrupteur";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  valeur: boolean;
  detail: string;
  enCours: boolean;
  onChanger: (valeur: boolean) => void;
};

export function InterrupteurPresence({ valeur, detail, enCours, onChanger }: Props) {
  const T = utiliserTextes(TEXTES_QUI_EST_LA_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const { piste, pastille } = utiliserCouleursInterrupteur();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={T.montrer}
      accessibilityHint={enCours ? T.enCours : detail}
      accessibilityState={{ checked: valeur, disabled: enCours, busy: enCours }}
      disabled={enCours}
      onPress={() => {
        vibrerLegerement();
        onChanger(!valeur);
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-[18px] border border-ligne bg-carte px-3.5 py-3 active:opacity-80 ${enCours ? "opacity-60" : ""}`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-semi text-sm text-encre">{T.montrer}</Text>
        <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(enCours ? T.enCours : detail)}</Text>
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value={valeur} trackColor={{ false: couleurs.ligne, true: piste }} ios_backgroundColor={couleurs.ligne} thumbColor={valeur ? pastille : couleurs.gris} />
      </View>
    </Pressable>
  );
}
