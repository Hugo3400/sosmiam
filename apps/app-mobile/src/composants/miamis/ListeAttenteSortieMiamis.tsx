import { Pressable, Text, View } from "react-native";

import type { PersonneResume } from "@sos-miam/commun/types/social";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  personnes: PersonneResume[];
  onRetirer: (personneId: string) => void;
};

export function ListeAttenteSortieMiamis({ personnes, onRetirer }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  if (personnes.length === 0) return null;
  return (
    <View className="gap-2.5">
      <Text accessibilityRole="header" className="font-texte-gras text-[15px] text-encre">
        {T.attenteTitre}
      </Text>
      {personnes.map((p, i) => (
        <View key={p.id} className="flex-row items-center gap-3">
          <Text className="w-6 font-texte-gras text-sm text-gris">{`${i + 1}.`}</Text>
          <RondMiami personne={p} taille={32} />
          <Text numberOfLines={1} className="flex-1 font-texte-semi text-sm text-encre">{`@${p.pseudo}`}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={TE.retirerAttenteLu(p.pseudo)}
            hitSlop={6}
            onPress={() => onRetirer(p.id)}
            className="min-h-11 justify-center active:opacity-70"
          >
            <Text className="font-texte-semi text-[13px] text-rouge-texte underline">{T.retirerAttente}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
