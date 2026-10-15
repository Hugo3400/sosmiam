import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  nomLieu: string;
  annulation: "demande" | "reservation" | null;
  onOuvrirLieu: () => void;
  onAnnuler: () => void;
};

type PropsAction = { libelle: string; libelleLu: string; indice: string; danger?: boolean; onPress: () => void };

function BoutonAction({ libelle, libelleLu, indice, danger = false, onPress }: PropsAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-11 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
    >
      <Text className={`font-texte-gras text-sm ${danger ? "text-rouge-texte" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}

export function ActionsReservation({ nomLieu, annulation, onOuvrirLieu, onAnnuler }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <BoutonAction libelle="Voir le lieu" libelleLu={`Voir la fiche de ${nomLieu}`} indice="Ouvre la fiche du lieu" onPress={onOuvrirLieu} />
      {annulation ? (
        <BoutonAction
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
