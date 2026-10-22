import { Pressable, Text } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  idee: IdeeMiamis;
  onOuvrir: () => void;
};

export function CarteIdeeDuMois({ idee, onOuvrir }: Props) {
  const statut = TEXTES_IDEES.ideeDuMoisStatut[idee.statut];
  const merci = TEXTES_IDEES.ideeDuMoisMerci(idee.auteur?.pseudo ?? null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={TEXTES_IDEES.ouvrirIdeeDuMois(idee.titre)}
      accessibilityHint={`${statut} ${merci}`.trim()}
      onPress={onOuvrir}
      className="gap-1.5 rounded-carte bg-nuit px-4 py-3.5 active:opacity-90"
    >
      <Text className="font-texte-gras text-[11px] uppercase tracking-widest text-jaune">{TEXTES_IDEES.ideeDuMois(idee.ideeDuMois ?? "")}</Text>
      <Text className="font-titre text-[19px] leading-6 text-lait">{idee.titre}</Text>
      <Text className="font-texte text-[13px] leading-5 text-gris-nuit">{lierPonctuation(`${statut} ${merci}`.trim())}</Text>
    </Pressable>
  );
}
