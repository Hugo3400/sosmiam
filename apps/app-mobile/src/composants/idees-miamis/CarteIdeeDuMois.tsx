import { Pressable, Text } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  idee: IdeeMiamis;
  onOuvrir: () => void;
};

export function CarteIdeeDuMois({ idee, onOuvrir }: Props) {
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const statut = T.ideeDuMoisStatut[idee.statut];
  const merci = T.ideeDuMoisMerci(idee.auteur?.pseudo ?? null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.ouvrirIdeeDuMois(idee.titre)}
      accessibilityHint={`${statut} ${merci}`.trim()}
      onPress={onOuvrir}
      className="gap-1.5 rounded-carte bg-nuit px-4 py-3.5 active:opacity-90"
    >
      <Text className="font-texte-gras text-[11px] uppercase tracking-widest text-jaune">{T.ideeDuMois(idee.ideeDuMois ?? "")}</Text>
      <Text className="font-titre text-[19px] leading-6 text-lait">{idee.titre}</Text>
      <Text className="font-texte text-[13px] leading-5 text-gris-nuit">{lierPonctuation(`${statut} ${merci}`.trim())}</Text>
    </Pressable>
  );
}
