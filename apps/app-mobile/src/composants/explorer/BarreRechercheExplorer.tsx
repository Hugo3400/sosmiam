import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Pressable, TextInput, View } from "react-native";

import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  valeur: string;
  onChange: (texte: string) => void;
};

const LONGUEUR_MAX = 60;

/** La recherche d'Explorer, posée sur la carte : bord noir arrondi, loupe, et une croix « Effacer » dès qu'il y a du texte. */
export function BarreRechercheExplorer({ valeur, onChange }: Props) {
  const champ = useRef<TextInput>(null);

  function effacer() {
    vibrerLegerement();
    onChange("");
    // La croix disparaît avec le texte : le lecteur d'écran reprend sur le champ, pas n'importe où dans l'écran
    setTimeout(() => deplacerFocusLecteurEcran(champ.current), 150);
  }

  return (
    <View className="relative">
      {/* Ombre décalée, comme les boutons : la barre se détache bien de la carte */}
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <View className="relative min-h-12 flex-row items-center rounded-full border-2 border-encre bg-white pl-4">
        <Ionicons name="search" size={20} color={couleurs.encre} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <TextInput
          ref={champ}
          accessibilityLabel="Rechercher un lieu, un plat ou un quartier"
          value={valeur}
          onChangeText={onChange}
          placeholder="Un lieu, un plat, un quartier…"
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
          className="min-h-11 flex-1 px-3 py-2.5 font-texte text-base text-encre"
        />
        {valeur.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={effacer}
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <Ionicons name="close-circle" size={22} color={couleurs.gris} />
          </Pressable>
        ) : (
          <View className="w-3" />
        )}
      </View>
    </View>
  );
}
