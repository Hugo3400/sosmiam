import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef } from "react";
import { Pressable, TextInput, View } from "react-native";

import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  valeur: string;
  onChange: (texte: string) => void;
};

const LONGUEUR_MAX = 60;

export function RechercheDiscussions({ valeur, onChange }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const champ = useRef<TextInput>(null);

  function effacer() {
    vibrerLegerement();
    onChange("");
    setTimeout(() => deplacerFocusLecteurEcran(champ.current), 150);
  }

  return (
    <View className="min-h-11 flex-row items-center rounded-full border-2 border-encre bg-carte pl-4">
      <Ionicons name="search" size={18} color={couleurs.gris} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <TextInput
        ref={champ}
        accessibilityLabel={T.chercher}
        accessibilityHint={T.indiceChercher}
        value={valeur}
        onChangeText={onChange}
        placeholder={T.chercher}
        placeholderTextColor={couleurs.gris}
        selectionColor={couleurs.encre}
        cursorColor={couleurs.encre}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        clearButtonMode="never"
        maxLength={LONGUEUR_MAX}
        className="min-h-10 flex-1 px-3 py-2 font-texte text-[15px] text-encre"
      />
      {valeur.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.effacerRecherche}
          onPress={effacer}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
        >
          <Ionicons name="close-circle" size={20} color={couleurs.gris} />
        </Pressable>
      ) : (
        <View className="w-3" />
      )}
    </View>
  );
}
