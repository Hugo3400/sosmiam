import { View } from "react-native";

import { BoutonActionReservation } from "~/composants/reservations/BoutonActionReservation";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { direDeLieuLangue } from "~/fonctions/langue/dire-de-lieu-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nomLieu: string;
  annulation: "demande" | "reservation" | null;
  onOuvrirLieu: (() => void) | null;
  onAnnuler: () => void;
};

export function ActionsReservation({ nomLieu, annulation, onOuvrirLieu, onAnnuler }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  if (!onOuvrirLieu && !annulation) return null;
  const libelleAnnuler = annulation === "demande" ? T.annulerDemande : T.annulerReservation;
  return (
    <View className="flex-row flex-wrap gap-2">
      {onOuvrirLieu ? (
        <BoutonActionReservation
          libelle={T.voirLieu}
          libelleLu={T.voirLieuLu(direDeLieuLangue(nomLieu, langue), nomLieu)}
          indice={T.voirLieuIndice}
          onPress={onOuvrirLieu}
        />
      ) : null}
      {annulation ? (
        <BoutonActionReservation
          libelle={annulation === "demande" ? T.annulerDemande : T.annuler}
          libelleLu={T.annulerLu(libelleAnnuler, direChezLieuLangue(nomLieu, langue))}
          indice={T.annulerIndice}
          danger
          onPress={onAnnuler}
        />
      ) : null}
    </View>
  );
}
