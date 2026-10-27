import { useState } from "react";
import { Text, View } from "react-native";

import { REPONSE_LIEU_ACTUS_MAX } from "@sos-miam/commun/regles/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import type { TEXTES_ACTUS_PRO } from "~/contenus/textes-actus-pro";

type Props = {
  visible: boolean;
  signature: string;
  T: Traduction<typeof TEXTES_ACTUS_PRO>["feuille"];
  onEnvoyer: (texte: string) => void;
  onFermer: () => void;
};

export function FeuilleReponseActus({ visible, signature, T, onEnvoyer, onFermer }: Props) {
  const [texte, setTexte] = useState("");
  const vide = texte.trim().length === 0;
  const fermer = () => {
    setTexte("");
    onFermer();
  };

  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      sousTitre={T.sousTitre(signature)}
      onFermer={fermer}
      pied={
        <>
          <Bouton
            libelle={T.envoyer}
            variante="encre"
            desactive={vide}
            onPress={() => {
              onEnvoyer(texte.trim());
              setTexte("");
            }}
          />
          <Bouton libelle={T.pasMaintenant} variante="blanc" onPress={fermer} />
        </>
      }
    >
      <View className="gap-2">
        <ChampTexte
          libelle={T.champ}
          valeur={texte}
          onChangeTexte={setTexte}
          placeholder={T.placeholder}
          aide={T.compteur(texte.length, REPONSE_LIEU_ACTUS_MAX)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={REPONSE_LIEU_ACTUS_MAX}
          autoCapitalize="sentences"
        />
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{T.regle}</Text>
      </View>
    </FeuilleBas>
  );
}
