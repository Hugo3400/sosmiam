import type { Ref } from "react";
import { View, type TextInput } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTE_AVIS_MAX, TEXTE_AVIS_MIN } from "@sos-miam/commun/regles/avis";
import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { BlocPhotoAvis } from "~/composants/avis/BlocPhotoAvis";
import { ChoixNoteAvis } from "~/composants/avis/ChoixNoteAvis";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import type { PhotoAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";

type Props = {
  note: NoteAvis | null;
  texte: string;
  photo: PhotoAvis | null;
  pointsPhoto: number;
  repasOffert: boolean;
  preparationPhoto: boolean;
  refTexte?: Ref<TextInput>;
  erreurTexte: string | null;
  erreurPhoto: string | null;
  mentionAlcool: boolean;
  desactive: boolean;
  onChoisirNote: (note: NoteAvis) => void;
  onChangerTexte: (texte: string) => void;
  onAjouterPhoto: () => void;
  onRetirerPhoto: () => void;
};

function decrireLongueur(texte: string): string {
  const manque = TEXTE_AVIS_MIN - texte.trim().length;
  const compteur = `${texte.length}/${TEXTE_AVIS_MAX}`;
  if (manque <= 0) return `${compteur} · ${TEXTES_DONNER_AVIS.texteAideCritique}`;
  const reste = manque === 1 ? TEXTES_DONNER_AVIS.texteManqueUn : remplirModele(TEXTES_DONNER_AVIS.texteManque, { manque: String(manque) });
  return `${compteur} · ${reste}`;
}

export function FormulaireAvis({
  note,
  texte,
  photo,
  pointsPhoto,
  repasOffert,
  preparationPhoto,
  refTexte,
  erreurTexte,
  erreurPhoto,
  mentionAlcool,
  desactive,
  onChoisirNote,
  onChangerTexte,
  onAjouterPhoto,
  onRetirerPhoto,
}: Props) {
  return (
    <View className="gap-7">
      <ChoixNoteAvis note={note} onChoisir={onChoisirNote} />
      <View className="gap-3">
        <ChampTexte
          ref={refTexte}
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
          editable={!desactive}
        />
        {mentionAlcool ? <MentionPrevention /> : null}
      </View>
      <BlocPhotoAvis
        photo={photo}
        pointsPhoto={pointsPhoto}
        repasOffert={repasOffert}
        preparation={preparationPhoto}
        erreur={erreurPhoto}
        desactive={desactive}
        onAjouter={onAjouterPhoto}
        onRetirer={onRetirerPhoto}
      />
    </View>
  );
}
