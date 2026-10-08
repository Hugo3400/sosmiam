import { Text, View } from "react-native";

type Props = {
  lieuxSauves: number;
  lieuxDeniches: number;
  badgesObtenus: number;
  badgesTotal: number;
};

type Chiffre = { valeur: string; libelle: string; lu: string };

/** Trois chiffres honnêtes, comptés sur ce téléphone : lieux sauvés, lieux dénichés et badges obtenus. */
export function ChiffresProfil({ lieuxSauves, lieuxDeniches, badgesObtenus, badgesTotal }: Props) {
  const chiffres: Chiffre[] = [
    {
      valeur: String(lieuxSauves),
      libelle: lieuxSauves > 1 ? "lieux sauvés" : "lieu sauvé",
      lu: `${lieuxSauves} ${lieuxSauves > 1 ? "lieux sauvés" : "lieu sauvé"}`,
    },
    {
      valeur: String(lieuxDeniches),
      libelle: lieuxDeniches > 1 ? "lieux dénichés" : "lieu déniché",
      lu: `${lieuxDeniches} ${lieuxDeniches > 1 ? "lieux dénichés" : "lieu déniché"} en premier`,
    },
    {
      valeur: `${badgesObtenus}/${badgesTotal}`,
      libelle: "badges",
      lu: `${badgesObtenus} badge${badgesObtenus > 1 ? "s" : ""} obtenu${badgesObtenus > 1 ? "s" : ""} sur ${badgesTotal}`,
    },
  ];

  return (
    <View className="flex-row rounded-carte border-2 border-encre bg-white py-4">
      {chiffres.map((c, i) => (
        <View key={c.libelle} accessible accessibilityLabel={c.lu} className={`flex-1 items-center px-1 ${i > 0 ? "border-l-2 border-ligne" : ""}`}>
          <Text className="font-titre text-2xl text-encre">{c.valeur}</Text>
          <Text className="text-center font-texte text-sm text-gris">{c.libelle}</Text>
        </View>
      ))}
    </View>
  );
}
