import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ETIQUETTES_VISIBLES_PAR_FAMILLE } from "@sos-miam/commun/regles/etiquettes";
import type { FamilleEtiquettesOfficielles } from "@sos-miam/commun/types/etiquette";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";

type Props = {
  famille: FamilleEtiquettesOfficielles;
  choisies: readonly string[];
  onBasculer: (nom: string) => void;
  plein?: boolean;
  sansTitre?: boolean;
};

export function FamilleEtiquettesACocher({ famille, choisies, onBasculer, plein = false, sansTitre = false }: Props) {
  const [toutes, setToutes] = useState(false);
  const visibles = toutes ? famille.etiquettes : famille.etiquettes.filter((nom, i) => i < ETIQUETTES_VISIBLES_PAR_FAMILLE || choisies.includes(nom));
  const reste = famille.etiquettes.length - visibles.length;

  return (
    <View className="gap-2">
      {sansTitre ? null : (
        <Text accessibilityRole="header" className="font-texte-gras text-xs uppercase tracking-widest text-gris">
          {famille.nom}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {visibles.map((nom, i) => {
          const choisie = choisies.includes(nom);
          return (
            <View key={nom} className={!choisie && plein ? "opacity-40" : ""}>
              <Pastille libelle={nom} choisi={choisie} position={i + 1} total={visibles.length} onPress={() => onBasculer(nom)} />
            </View>
          );
        })}
      </View>
      {reste > 0 || toutes ? (
        <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setToutes(!toutes)} className="min-h-11 justify-center self-start active:opacity-70">
          <Text className="font-texte-semi text-sm text-encre underline">{toutes ? TEXTES_ETIQUETTES.voirMoins : TEXTES_ETIQUETTES.voirPlus(reste)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
