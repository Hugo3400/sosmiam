import { ScrollView, View } from "react-native";

import { ETIQUETTES_FILTRE_EXPLORER } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_ACCUEIL_MIAMIS } from "~/contenus/textes-miamis";
import type { FiltreSortiesMiamis } from "~/fonctions/miamis/filtrer-sorties-miamis";

type Props = {
  filtre: FiltreSortiesMiamis;
  onChoisir: (filtre: FiltreSortiesMiamis) => void;
};

const FILTRES: { cle: string; nom: string; filtre: FiltreSortiesMiamis }[] = [
  { cle: "toutes", nom: TEXTES_ACCUEIL_MIAMIS.toutes, filtre: { type: "toutes" } },
  { cle: "envies", nom: TEXTES_ACCUEIL_MIAMIS.mesEnvies, filtre: { type: "envies" } },
  ...ETIQUETTES_FILTRE_EXPLORER.map((nom) => ({ cle: nom, nom, filtre: { type: "etiquette", nom } as const })),
];

const cleDe = (filtre: FiltreSortiesMiamis) => (filtre.type === "etiquette" ? filtre.nom : filtre.type);

export function FiltresSortiesMiamis({ filtre, onChoisir }: Props) {
  const actif = cleDe(filtre);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
      {FILTRES.map((f, i) => (
        <View key={f.cle}>
          <Pastille libelle={f.nom} role="radio" choisi={f.cle === actif} position={i + 1} total={FILTRES.length} onPress={() => onChoisir(f.filtre)} />
        </View>
      ))}
    </ScrollView>
  );
}
