import { View } from "react-native";

import { BoutonActionReservation } from "~/composants/reservations/BoutonActionReservation";

type Props = {
  nomLieu: string;
  annulation: "demande" | "reservation" | null;
  onOuvrirLieu: () => void;
  onAnnuler: () => void;
};

export function ActionsReservation({ nomLieu, annulation, onOuvrirLieu, onAnnuler }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <BoutonActionReservation libelle="Voir le lieu" libelleLu={`Voir la fiche de ${nomLieu}`} indice="Ouvre la fiche du lieu" onPress={onOuvrirLieu} />
      {annulation ? (
        <BoutonActionReservation
          libelle={annulation === "demande" ? "Annuler la demande" : "Annuler"}
          libelleLu={`${annulation === "demande" ? "Annuler la demande" : "Annuler la réservation"}, ${nomLieu}`}
          indice="Te demande de confirmer avant d'annuler"
          danger
          onPress={onAnnuler}
        />
      ) : null}
    </View>
  );
}
