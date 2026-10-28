import { Text, View } from "react-native";

import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import { TEXTES_BOUEES_SEMAINE_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
};

/** Tes bouées de la semaine : une 🛟 par rescousse, estompée une fois donnée. Elles se rechargent le lundi. */
export function BoueesSemaine({ restantes }: Props) {
  const T = utiliserTextes(TEXTES_BOUEES_SEMAINE_PAR_LANGUE);
  const disponibles = Math.min(RESCOUSSES_PAR_SEMAINE, Math.max(0, restantes));
  const message =
    disponibles === 0
      ? T.toutesDonnees(RESCOUSSES_PAR_SEMAINE)
      : disponibles === RESCOUSSES_PAR_SEMAINE
        ? T.toutesLa(RESCOUSSES_PAR_SEMAINE)
        : T.reste(disponibles);
  const compte = T.compte(disponibles, RESCOUSSES_PAR_SEMAINE);

  return (
    <View accessible accessibilityLabel={`${T.titre}. ${compte}. ${message}`} className="flex-row items-center gap-3 border-t border-ligne pt-4">
      <View className="flex-row gap-1">
        {Array.from({ length: RESCOUSSES_PAR_SEMAINE }, (_, i) => (
          <Text key={i} className={`text-[26px] leading-8 ${i < disponibles ? "" : "opacity-25"}`}>🛟</Text>
        ))}
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{T.titre}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(message)}</Text>
      </View>
    </View>
  );
}
