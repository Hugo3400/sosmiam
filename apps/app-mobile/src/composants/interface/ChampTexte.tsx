import { useEffect, useState, type Ref } from "react";
import { AccessibilityInfo, Platform, Text, TextInput, View, type TextInputProps } from "react-native";

import couleurs from "~/theme/couleurs";

type Props = Omit<TextInputProps, "value" | "onChangeText" | "className" | "style"> & {
  /** Libellé affiché au-dessus du champ (et lu par VoiceOver) */
  libelle: string;
  /** Petit complément à côté du libellé, ex. « facultatif » */
  mention?: string;
  valeur: string;
  onChangeTexte: (texte: string) => void;
  /** Petite phrase d'aide sous le champ */
  aide?: string;
  /** Message d'erreur sous le champ (remplace l'aide, bord rouge) */
  erreur?: string | null;
  ref?: Ref<TextInput>;
};

/** Champ de saisie SOS Miam : libellé visible, bord noir arrondi, ombre décalée quand on écrit dedans, aide ou erreur dessous. */
export function ChampTexte({ libelle, mention, valeur, onChangeTexte, aide, erreur, ref, onFocus, onBlur, ...autres }: Props) {
  const [actif, setActif] = useState(false);
  const message = erreur ?? aide;
  const libelleComplet = mention ? `${libelle}, ${mention}` : libelle;

  // Sur iPhone, VoiceOver ignore les « live regions » d'Android : l'erreur est annoncée quand elle apparaît,
  // après ce qu'il est en train de lire (souvent le champ suivant, quand l'erreur arrive en quittant celui-ci)
  useEffect(() => {
    if (erreur && Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(erreur, { queue: true });
  }, [erreur]);

  return (
    <View className="gap-2">
      {/* Le libellé visible n'est pas relu : le champ porte déjà le même texte pour VoiceOver */}
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
        {libelle}
        {mention ? <Text className="font-texte text-gris"> ({mention})</Text> : null}
      </Text>

      <View className="relative">
        {/* « relative » : sur le web, le champ doit passer au-dessus de son ombre */}
        {actif ? <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-encre" /> : null}
        <TextInput
          ref={ref}
          // L'erreur est relue en revenant sur le champ
          accessibilityLabel={erreur ? `${libelleComplet}. ${erreur}` : libelleComplet}
          value={valeur}
          onChangeText={onChangeTexte}
          onFocus={(evenement) => {
            setActif(true);
            onFocus?.(evenement);
          }}
          onBlur={(evenement) => {
            setActif(false);
            onBlur?.(evenement);
          }}
          placeholderTextColor={couleurs.gris}
          selectionColor={couleurs.encre}
          cursorColor={couleurs.encre}
          className={`relative min-h-[52px] rounded-2xl border-2 bg-white px-4 py-3 font-texte text-[17px] text-encre
            ${erreur ? "border-rouge-texte" : "border-encre"}`}
          {...autres}
        />
      </View>

      {/* L'aide ou l'erreur suit le champ dans l'ordre de lecture de VoiceOver */}
      {message ? (
        <Text accessibilityLiveRegion={erreur ? "polite" : "none"} className={`font-texte text-sm leading-5 ${erreur ? "text-rouge-texte" : "text-gris"}`}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
