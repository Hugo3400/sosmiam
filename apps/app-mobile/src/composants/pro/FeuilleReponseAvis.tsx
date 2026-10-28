import { useState } from "react";
import { Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { REPONSE_LIEU_MAX } from "@sos-miam/commun/regles/avis";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_AVIS_PRO_PAR_LANGUE } from "~/contenus/textes-avis-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  signature: string;
  enCours: boolean;
  motRefuse: boolean;
  onPublier: (texte: string) => void;
  onChanger: () => void;
  onFermer: () => void;
};

export function FeuilleReponseAvis({ visible, signature, enCours, motRefuse, onPublier, onChanger, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_AVIS_PRO_PAR_LANGUE);
  const [texte, setTexte] = useState("");
  const vide = texte.trim().length === 0;
  const fermer = () => {
    setTexte("");
    onFermer();
  };

  return (
    <FeuilleBas
      visible={visible}
      titre={remplirModele(T.feuilleTitre, { signature })}
      sousTitre={T.feuilleSousTitre}
      onFermer={fermer}
      pied={
        <>
          <Bouton
            libelle={enCours ? T.publierEnCours : T.publier}
            variante="encre"
            desactive={vide || enCours}
            indice={vide ? T.publierIndiceVide : undefined}
            onPress={() => onPublier(texte)}
          />
          <Bouton libelle={T.pasMaintenant} variante="blanc" desactive={enCours} onPress={fermer} />
        </>
      }
    >
      <View className="gap-2">
        <ChampTexte
          libelle={T.champLibelle}
          valeur={texte}
          onChangeTexte={(nouveau) => {
            setTexte(nouveau);
            onChanger();
          }}
          placeholder={T.champPlaceholder}
          aide={remplirModele(T.champAide, { longueur: String(texte.length), max: String(REPONSE_LIEU_MAX) })}
          erreur={motRefuse ? T.champRefuse : null}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={REPONSE_LIEU_MAX}
          autoCapitalize="sentences"
          editable={!enCours}
        />
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.relecture)}</Text>
      </View>
    </FeuilleBas>
  );
}
