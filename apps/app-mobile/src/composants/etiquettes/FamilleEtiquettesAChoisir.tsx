import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ETIQUETTES_VISIBLES_PAR_FAMILLE } from "@sos-miam/commun/regles/etiquettes";
import type { FamilleEtiquettesOfficielles } from "@sos-miam/commun/types/etiquette";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";

type Props = {
  famille: FamilleEtiquettesOfficielles;
  choisie: string | null;
  onChoisir: (nom: string) => void;
};

export function FamilleEtiquettesAChoisir({ famille, choisie, onChoisir }: Props) {
  const [toutes, setToutes] = useState(false);
  const visibles = toutes ? famille.etiquettes : famille.etiquettes.filter((nom, i) => i < ETIQUETTES_VISIBLES_PAR_FAMILLE || nom === choisie);
  const reste = famille.etiquettes.length - visibles.length;

  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-texte-gras text-xs uppercase tracking-widest text-gris">
        {famille.nom}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {visibles.map((nom, i) => (
          <Pastille key={nom} libelle={nom} role="radio" choisi={nom === choisie} position={i + 1} total={visibles.length} onPress={() => onChoisir(nom)} />
        ))}
      </View>
      {reste > 0 || toutes ? (
        <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setToutes(!toutes)} className="min-h-11 justify-center self-start active:opacity-70">
          <Text className="font-texte-semi text-sm text-encre underline">{toutes ? TEXTES_ETIQUETTES.voirMoins : TEXTES_ETIQUETTES.voirPlus(reste)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
