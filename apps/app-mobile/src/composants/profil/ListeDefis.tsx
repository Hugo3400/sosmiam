import { Text, View } from "react-native";

import { CarteDefi } from "~/composants/profil/CarteDefi";
import { defisExemples } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerAvanceeDefi } from "~/fonctions/ambassadeur/calculer-avancee-defi";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";

type Props = {
  mesures: MesuresActivite;
};

/** Les défis du moment, chacun avec son avancée (suivie sur le téléphone quand c'est possible). Un défi terminé ne reste que s'il est réussi. */
export function ListeDefis({ mesures }: Props) {
  const aujourdhui = formaterDateIso(new Date());
  // Les dates « AAAA-MM-JJ » se comparent comme du texte ; le dernier jour du défi compte encore
  const defis = defisExemples.flatMap((defi) => {
    const fait = calculerAvanceeDefi(defi, mesures);
    const termine = !!defi.fin && defi.fin < aujourdhui;
    return termine && fait < defi.objectif ? [] : [{ defi, fait }];
  });
  if (defis.length === 0) return null;

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Défis du moment</Text>
        <Text className="font-texte text-sm text-gris">Des petites quêtes gourmandes, des points en plus.</Text>
      </View>
      {defis.map(({ defi, fait }) => (
        <CarteDefi key={defi.id} defi={defi} fait={fait} />
      ))}
    </View>
  );
}
