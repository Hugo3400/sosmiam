import { Text } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  titre: string;
};

export function TitreEtapeReservation({ titre }: Props) {
  return (
    <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
      {lierPonctuation(titre)}
    </Text>
  );
}
