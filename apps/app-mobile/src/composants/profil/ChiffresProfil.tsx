import { Text, View } from "react-native";

import { TEXTES_CHIFFRES_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieuxSauves: number;
  premiersSauvetages: number;
  badgesObtenus: number;
  badgesTotal: number;
};

type Chiffre = { valeur: string; libelle: string; lu: string };

export function ChiffresProfil({ lieuxSauves, premiersSauvetages, badgesObtenus, badgesTotal }: Props) {
  const T = utiliserTextes(TEXTES_CHIFFRES_PROFIL_PAR_LANGUE);
  const chiffres: Chiffre[] = [
    {
      valeur: String(lieuxSauves),
      libelle: T.lieuxSauves(lieuxSauves),
      lu: T.lieuxSauvesLu(lieuxSauves),
    },
    {
      valeur: String(premiersSauvetages),
      libelle: T.premiers(premiersSauvetages),
      lu: T.premiersLu(premiersSauvetages),
    },
    {
      valeur: `${badgesObtenus}/${badgesTotal}`,
      libelle: "badges",
      lu: T.badgesLu(badgesObtenus, badgesTotal),
    },
  ];

  return (
    <View className="flex-row border-t border-ligne pt-4">
      {chiffres.map((c, i) => (
        <View key={c.libelle} accessible accessibilityLabel={c.lu} className={`flex-1 items-center px-1 ${i > 0 ? "border-l-2 border-ligne" : ""}`}>
          <Text className="font-titre text-2xl text-encre">{c.valeur}</Text>
          <Text className="text-center font-texte text-[13px] leading-[18px] text-gris">{c.libelle}</Text>
        </View>
      ))}
    </View>
  );
}
