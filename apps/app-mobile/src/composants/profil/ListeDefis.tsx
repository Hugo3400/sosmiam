import { Text, View } from "react-native";

import { CarteDefi } from "~/composants/profil/CarteDefi";
import { defisExemples } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerAvanceeDefi } from "~/fonctions/ambassadeur/calculer-avancee-defi";

type Props = {
  mesures: MesuresActivite;
};

/** Les défis du moment, chacun avec son avancée (suivie sur le téléphone quand c'est possible). */
export function ListeDefis({ mesures }: Props) {
  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Défis du moment</Text>
        <Text className="font-texte text-sm text-gris">Des petites quêtes gourmandes, des points en plus.</Text>
      </View>
      {defisExemples.map((defi) => (
        <CarteDefi key={defi.id} defi={defi} fait={calculerAvanceeDefi(defi, mesures)} />
      ))}
    </View>
  );
}
