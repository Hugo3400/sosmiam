import { Text, View } from "react-native";

import { CarteEvenementLieu } from "~/composants/lieux/CarteEvenementLieu";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserEvenementsDuLieu } from "~/hooks/utiliser-evenements-du-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** « À venir » sur la fiche d'un lieu : ses prochains événements (rien s'il n'y en a pas). « Ça m'intéresse » demande un compte. */
export function BlocEvenementsLieu({ lieuId, age }: { lieuId: number; age: number | null }) {
  const exiger = utiliserCompteRequis();
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).evenements;
  const { evenements, interesse, basculerInteret } = utiliserEvenementsDuLieu(lieuId, age);
  if (!evenements || evenements.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.aVenir}
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
