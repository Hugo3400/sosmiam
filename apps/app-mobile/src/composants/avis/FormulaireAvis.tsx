import { View } from "react-native";

import { TEXTE_AVIS_MAX, TEXTE_AVIS_MIN } from "@sos-miam/commun/regles/avis";
import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { BlocPhotoAvis, type SourcePhotoAvis } from "~/composants/avis/BlocPhotoAvis";
import { ChoixNoteAvis } from "~/composants/avis/ChoixNoteAvis";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";

type Props = {
  note: NoteAvis | null;
  texte: string;
  photo: SourcePhotoAvis | null;
  pointsPhoto: number;
  repasOffert: boolean;
  erreurTexte: string | null;
  onChoisirNote: (note: NoteAvis) => void;
  onChangerTexte: (texte: string) => void;
  onAjouterPhoto: () => void;
  onRetirerPhoto: () => void;
};

function decrireLongueur(texte: string): string {
  const manque = TEXTE_AVIS_MIN - texte.trim().length;
  const compteur = `${texte.length}/${TEXTE_AVIS_MAX}`;
  if (manque <= 0) return `${compteur} · ${TEXTES_DONNER_AVIS.texteAideCritique}`;
  return `${compteur} · encore ${manque} caractère${manque > 1 ? "s" : ""} au moins`;
}

export function FormulaireAvis({ note, texte, photo, pointsPhoto, repasOffert, erreurTexte, onChoisirNote, onChangerTexte, onAjouterPhoto, onRetirerPhoto }: Props) {
  return (
    <View className="gap-7">
      <ChoixNoteAvis note={note} onChoisir={onChoisirNote} />
      <ChampTexte
        libelle={TEXTES_DONNER_AVIS.texteTitre}
        valeur={texte}
        onChangeTexte={onChangerTexte}
        placeholder={TEXTES_DONNER_AVIS.textePlaceholder}
        aide={decrireLongueur(texte)}
        erreur={erreurTexte}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={TEXTE_AVIS_MAX}
        autoCapitalize="sentences"
      />
      <BlocPhotoAvis photo={photo} pointsPhoto={pointsPhoto} repasOffert={repasOffert} onAjouter={onAjouterPhoto} onRetirer={onRetirerPhoto} />
    </View>
  );
}
