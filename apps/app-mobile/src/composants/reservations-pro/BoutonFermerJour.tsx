import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { TEXTES_FERMER_JOUR_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  ferme: boolean;
  enCours: boolean;
  onBasculer: (ferme: boolean) => void;
};

export function BoutonFermerJour({ ferme, enCours, onBasculer }: Props) {
  const T = utiliserTextes(TEXTES_FERMER_JOUR_PAR_LANGUE);
  const [confirmation, setConfirmation] = useState(false);
  return (
    <View className="gap-2">
      {ferme ? (
        <Text accessibilityLiveRegion="polite" className="rounded-2xl bg-rose-alerte px-3.5 py-2.5 font-texte-semi text-[14px] leading-5 text-encre">
          {lierPonctuation(T.ferme)}
        </Text>
      ) : null}
      <Bouton
        libelle={ferme ? T.rouvrir : T.fermer}
        variante={ferme ? "jaune" : "blanc"}
        petit
        indice={ferme ? T.rouvrirIndice : T.fermerIndice}
        desactive={enCours}
        onPress={() => (ferme ? onBasculer(false) : setConfirmation(true))}
      />
      <FeuilleConfirmation
        visible={confirmation}
        emoji="🛑"
        titre={T.confirmationTitre}
        detail={T.confirmationDetail}
        libelleConfirmer={T.confirmationConfirmer}
        libelleRester={T.confirmationRester}
        onConfirmer={() => onBasculer(true)}
        onFermer={() => setConfirmation(false)}
      />
    </View>
  );
}
