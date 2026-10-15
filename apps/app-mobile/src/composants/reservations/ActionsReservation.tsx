import { View } from "react-native";

import { BoutonActionReservation } from "~/composants/reservations/BoutonActionReservation";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

type Props = {
  nomLieu: string;
  annulation: "demande" | "reservation" | null;
  onOuvrirLieu: (() => void) | null;
  onAnnuler: () => void;
};

export function ActionsReservation({ nomLieu, annulation, onOuvrirLieu, onAnnuler }: Props) {
  if (!onOuvrirLieu && !annulation) return null;
  const libelleAnnuler = annulation === "demande" ? "Annuler la demande" : "Annuler la réservation";
  return (
    <View className="flex-row flex-wrap gap-2">
      {onOuvrirLieu ? (
        <BoutonActionReservation libelle="Voir le lieu" libelleLu={`Voir la fiche ${direDeLieu(nomLieu)}`} indice="Ouvre la fiche du lieu" onPress={onOuvrirLieu} />
      ) : null}
      {annulation ? (
        <BoutonActionReservation
          libelle={annulation === "demande" ? "Annuler la demande" : "Annuler"}
          libelleLu={`${libelleAnnuler} ${direChezLieu(nomLieu)}`}
          indice="Te demande de confirmer avant d'annuler"
          danger
          onPress={onAnnuler}
        />
      ) : null}
    </View>
  );
}
