import { View } from "react-native";

import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { EtoileAvis } from "~/composants/avis/EtoileAvis";
import { NOTES_AVIS } from "~/contenus/textes-donner-avis";

type Props = {
  note: NoteAvis;
  taille?: number;
};

export function EtoilesAvis({ note, taille = 18 }: Props) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Note : ${note} sur 5`} className="flex-row gap-0.5">
      {NOTES_AVIS.map((valeur) => (
        <EtoileAvis key={valeur} pleine={valeur <= note} taille={taille} />
      ))}
    </View>
  );
}
