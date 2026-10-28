import { View } from "react-native";

import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { EtoileAvis } from "~/composants/avis/EtoileAvis";
import { NOTES_AVIS } from "~/contenus/textes-donner-avis";
import { TEXTES_ETOILES_AVIS_PAR_LANGUE } from "~/contenus/textes-etoiles-avis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  note: NoteAvis;
  taille?: number;
};

export function EtoilesAvis({ note, taille = 18 }: Props) {
  const T = utiliserTextes(TEXTES_ETOILES_AVIS_PAR_LANGUE);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={T.noteLue(note)} className="flex-row gap-0.5">
      {NOTES_AVIS.map((valeur) => (
        <EtoileAvis key={valeur} pleine={valeur <= note} taille={taille} />
      ))}
    </View>
  );
}
