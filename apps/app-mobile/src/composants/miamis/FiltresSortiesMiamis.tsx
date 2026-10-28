import { ScrollView, View } from "react-native";

import { ETIQUETTES_FILTRE_EXPLORER, NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import type { FiltreSortiesMiamis } from "~/fonctions/miamis/filtrer-sorties-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  filtre: FiltreSortiesMiamis;
  onChoisir: (filtre: FiltreSortiesMiamis) => void;
};

const cleDe = (filtre: FiltreSortiesMiamis) => (filtre.type === "etiquette" ? filtre.nom : filtre.type);

export function FiltresSortiesMiamis({ filtre, onChoisir }: Props) {
  const T = utiliserTextes(TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE);
  const nomsEtiquettes = utiliserTextes(NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE);
  const filtres: { cle: string; nom: string; filtre: FiltreSortiesMiamis }[] = [
    { cle: "toutes", nom: T.toutes, filtre: { type: "toutes" } },
    { cle: "envies", nom: T.mesEnvies, filtre: { type: "envies" } },
    ...ETIQUETTES_FILTRE_EXPLORER.map((nom) => ({ cle: nom, nom: nomsEtiquettes[nom] ?? nom, filtre: { type: "etiquette", nom } as const })),
  ];
  const actif = cleDe(filtre);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
      {filtres.map((f, i) => (
        <View key={f.cle}>
          <Pastille libelle={f.nom} role="radio" choisi={f.cle === actif} position={i + 1} total={filtres.length} onPress={() => onChoisir(f.filtre)} />
        </View>
      ))}
    </ScrollView>
  );
}
