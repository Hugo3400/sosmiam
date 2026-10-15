import { Platform, Pressable, Text, View } from "react-native";

import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { EtoileAvis } from "~/composants/avis/EtoileAvis";
import { LIBELLES_NOTES_AVIS, NOTES_AVIS, TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  note: NoteAvis | null;
  onChoisir: (note: NoteAvis) => void;
};

const ecrireEtoiles = (note: NoteAvis) => `${note} étoile${note > 1 ? "s" : ""} sur 5`;

export function ChoixNoteAvis({ note, onChoisir }: Props) {
  const ios = Platform.OS === "ios";
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-texte-semi text-base text-encre">
        {TEXTES_DONNER_AVIS.noteTitre}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={TEXTES_DONNER_AVIS.noteTitre} className="flex-row justify-center gap-1.5">
        {NOTES_AVIS.map((valeur) => {
          const choisie = note === valeur;
          return (
            <Pressable
              key={valeur}
              accessibilityRole={ios ? "button" : "radio"}
              accessibilityState={ios ? { selected: choisie } : { checked: choisie }}
              aria-checked={ios ? undefined : choisie}
              aria-selected={ios ? choisie : undefined}
              accessibilityLabel={`${ecrireEtoiles(valeur)} : ${LIBELLES_NOTES_AVIS[valeur]}`}
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
          {lierPonctuation(note ? LIBELLES_NOTES_AVIS[note] : TEXTES_DONNER_AVIS.noteVide)}
        </Text>
      </View>
    </View>
  );
}
