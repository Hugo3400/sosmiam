import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { lireNombreCouverts } from "~/fonctions/reservations/lire-nombre-couverts";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  avecHoraires: boolean;
  modifiable: boolean;
  onRegler: (couverts: number) => void;
  onNouveau: () => void;
};

const COUVERTS_MAX = 3000;

export function CarteModeTranquille({ avecHoraires, modifiable, onRegler, onNouveau }: Props) {
  const [couverts, setCouverts] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function regler() {
    const nombre = lireNombreCouverts(couverts);
    if (nombre === null || nombre < 1 || nombre > COUVERTS_MAX) return setErreur(T.repliCouvertsErreur);
    setErreur(null);
    onRegler(nombre);
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.repliTitre)}</Text>
      <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(T.repliTexte)}</Text>
      {!modifiable ? null : avecHoraires ? (
        <View className="gap-3">
          <ChampTexte
            libelle={T.repliCouverts}
            valeur={couverts}
            onChangeTexte={(texte) => {
              setCouverts(texte.replace(/\D/g, "").slice(0, 4));
              setErreur(null);
            }}
            placeholder={T.couvertsExemple}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={regler}
            aide={T.repliCouvertsAide}
            erreur={erreur}
          />
          <Bouton libelle={T.repliBouton} variante="encre" indice={T.repliAide} onPress={regler} />
        </View>
      ) : (
        <View className="gap-3">
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(T.repliSansHoraires)}</Text>
          <Bouton libelle={T.ajouterService} variante="encre" indice={T.ajouterServiceIndice} onPress={onNouveau} />
        </View>
      )}
    </View>
  );
}
