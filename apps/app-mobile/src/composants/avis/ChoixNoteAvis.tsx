import { Platform, Pressable, Text, View } from "react-native";

import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { EtoileAvis } from "~/composants/avis/EtoileAvis";
import { LIBELLES_NOTES_AVIS_PAR_LANGUE, NOTES_AVIS, TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { TEXTES_ETOILES_AVIS_PAR_LANGUE } from "~/contenus/textes-etoiles-avis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  note: NoteAvis | null;
  onChoisir: (note: NoteAvis) => void;
};

export function ChoixNoteAvis({ note, onChoisir }: Props) {
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const etoiles = utiliserTextes(TEXTES_ETOILES_AVIS_PAR_LANGUE);
  const libelles = utiliserTextes(LIBELLES_NOTES_AVIS_PAR_LANGUE);
  const ios = Platform.OS === "ios";
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-texte-semi text-base text-encre">
        {T.noteTitre}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={T.noteTitre} className="flex-row justify-center gap-1.5">
        {NOTES_AVIS.map((valeur) => {
          const choisie = note === valeur;
          return (
            <Pressable
              key={valeur}
              accessibilityRole={ios ? "button" : "radio"}
              accessibilityState={ios ? { selected: choisie } : { checked: choisie }}
              aria-checked={ios ? undefined : choisie}
              aria-selected={ios ? choisie : undefined}
              accessibilityLabel={etoiles.choixLu(valeur, libelles[valeur])}
              hitSlop={2}
              onPress={() => {
                vibrerLegerement();
                onChoisir(valeur);
              }}
              className="h-14 w-14 items-center justify-center rounded-full active:scale-90 active:opacity-80"
            >
              <EtoileAvis pleine={note !== null && valeur <= note} taille={42} />
            </Pressable>
          );
        })}
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="min-h-7 justify-center">
        <Text className={`text-center ${note ? "font-titre-gras text-lg text-encre" : "font-texte text-sm text-gris"}`}>
          {lierPonctuation(note ? libelles[note] : T.noteVide)}
        </Text>
      </View>
    </View>
  );
}
