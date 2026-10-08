import { Text, View } from "react-native";

import { Jauge } from "~/composants/interface/Jauge";
import type { Defi } from "~/contenus/defis-exemples";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  defi: Defi;
  /** Où en est la personne (calculerAvanceeDefi) */
  fait: number;
};

const SANS_MESURE = "Il avancera avec les visites validées, bientôt dans l'app.";

/** Un défi du moment : ce qu'il faut faire, où tu en es, ce qu'il rapporte et jusqu'à quand. Lu d'un seul bloc par le lecteur d'écran. */
export function CarteDefi({ defi, fait }: Props) {
  const reussi = fait >= defi.objectif;
  const pourcentage = Math.round((Math.min(fait, defi.objectif) / defi.objectif) * 100);
  const echeance = `+${defi.points} pts · jusqu'au ${defi.fin}`;
  const lu = [
    defi.titre,
    defi.texte,
    reussi ? "Défi réussi !" : `Avancée : ${fait} sur ${defi.objectif}`,
    `${defi.points} points à gagner, jusqu'au ${defi.fin}`,
    defi.mesure ? null : SANS_MESURE,
  ].filter(Boolean).join(". ");

  return (
    <View accessible accessibilityLabel={lu} className={`gap-3 rounded-carte border-2 border-encre p-4 ${reussi ? "bg-jaune-clair" : "bg-white"}`}>
      <View className="flex-row gap-3">
        <Text className="text-3xl">{defi.emoji}</Text>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{defi.titre}</Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(defi.texte)}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Jauge avancee={pourcentage / 100} className="flex-1" />
        <Text className="font-texte-gras text-sm text-encre">{reussi ? "Réussi ✅" : `${fait}/${defi.objectif}`}</Text>
      </View>

      <View className="self-start rounded-full bg-jaune px-3 py-1">
        <Text className="font-texte-semi text-[13px] text-encre">{echeance}</Text>
      </View>
      {defi.mesure ? null : <Text className="font-texte text-[13px] leading-5 text-gris">⏳ {SANS_MESURE}</Text>}
    </View>
  );
}
