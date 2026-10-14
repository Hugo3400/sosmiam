import { Text, View } from "react-native";

import { CarteEvenementLieu } from "~/composants/lieux/CarteEvenementLieu";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserEvenementsDuLieu } from "~/hooks/utiliser-evenements-du-lieu";

/** « À venir » sur la fiche d'un lieu : ses prochains événements (rien s'il n'y en a pas). « Ça m'intéresse » demande un compte. */
export function BlocEvenementsLieu({ lieuId, age }: { lieuId: number; age: number | null }) {
  const exiger = utiliserCompteRequis();
  const { evenements, interesse, basculerInteret } = utiliserEvenementsDuLieu(lieuId, age);
  if (!evenements || evenements.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        À venir
      </Text>
      {evenements.slice(0, 5).map((e) => (
        <CarteEvenementLieu
          key={e.id}
          evenement={e}
          interesse={interesse(e.id)}
          onInteret={() => {
            if (exiger("interesse")) void basculerInteret(e.id);
          }}
        />
      ))}
    </View>
  );
}
