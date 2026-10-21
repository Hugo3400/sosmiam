import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";

type Props = {
  modifie: boolean;
  enregistrement: boolean;
  onToutAnnuler: () => void;
  onEnregistrer: () => void;
};

export function PiedReglagesReservations({ modifie, enregistrement, onToutAnnuler, onEnregistrer }: Props) {
  return (
    <View className="gap-2 border-t border-ligne bg-creme px-5 pt-3" style={{ paddingBottom: 12 }}>
      {modifie ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte-semi text-sm text-gris">
          {T.pasEncoreEnregistre}
        </Text>
      ) : null}
      <View className="flex-row gap-3">
        {modifie ? (
          <Bouton className="flex-1" libelle={T.toutAnnuler} variante="blanc" indice={T.indiceToutAnnuler} desactive={enregistrement} onPress={onToutAnnuler} />
        ) : null}
        <Bouton
          className="flex-1"
          libelle={enregistrement ? T.enregistrement : T.enregistrer}
          indice={modifie ? T.indiceEnregistrer : T.rienAEnregistrer}
          desactive={!modifie || enregistrement}
          onPress={onEnregistrer}
        />
      </View>
    </View>
  );
}
