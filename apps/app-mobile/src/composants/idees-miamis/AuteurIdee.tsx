import { Text, View } from "react-native";

import type { PersonneResume } from "@sos-miam/commun/types/social";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  auteur: PersonneResume | null;
  monId: string;
  taille: number;
  suite?: string;
};

export function AuteurIdee({ auteur, monId, taille, suite }: Props) {
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const nom = !auteur ? T.auteurInconnu : auteur.id === monId ? T.parToi : `@${auteur.pseudo}`;
  return (
    <View className="flex-row items-center gap-2">
      {auteur ? <RondMiami personne={auteur} taille={taille} /> : null}
      <Text className="shrink font-texte text-[13px] text-gris">
        <Text className="font-texte-semi text-encre">{nom}</Text>
        {suite ? ` · ${suite}` : ""}
      </Text>
    </View>
  );
}
