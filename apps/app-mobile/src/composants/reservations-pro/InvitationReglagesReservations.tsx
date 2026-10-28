import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_REMPLISSAGE_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function InvitationReglagesReservations({ onRegler }: { onRegler: () => void }) {
  const T = utiliserTextes(TEXTES_REMPLISSAGE_PAR_LANGUE);
  return (
    <View className="gap-2 rounded-carte border-2 border-dashed border-gris/40 bg-carte/70 px-4 py-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
        {lierPonctuation(T.invitationTitre)}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.invitationTexte)}</Text>
      <Bouton libelle={T.invitationBouton} variante="blanc" petit className="mt-1 self-start" onPress={onRegler} />
    </View>
  );
}
