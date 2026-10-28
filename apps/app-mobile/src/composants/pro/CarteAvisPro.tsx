import { Text, View } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import { CarteAvisPublic } from "~/composants/avis/CarteAvisPublic";
import { Bouton } from "~/composants/interface/Bouton";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { TEXTES_AVIS_PRO_PAR_LANGUE } from "~/contenus/textes-avis-pro";
import type { SourcePhotoAvis } from "~/contenus/type-donner-avis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  avis: AvisPublic;
  sourcePhoto: SourcePhotoAvis | null;
  nomLieu: string;
  gerant: boolean;
  desactive: boolean;
  onRepondre: () => void;
};

export function CarteAvisPro({ avis, sourcePhoto, nomLieu, gerant, desactive, onRepondre }: Props) {
  const T = utiliserTextes(TEXTES_AVIS_PRO_PAR_LANGUE);
  const alcool = parleDAlcool(avis.texte) || parleDAlcool(avis.reponseLieu?.texte);
  return (
    <View className="gap-2">
      <CarteAvisPublic avis={avis} sourcePhoto={sourcePhoto} nomLieu={nomLieu} />
      {alcool ? <MentionPrevention /> : null}
      {avis.reponseLieu ? null : gerant ? (
        <Bouton libelle={T.repondre} petit desactive={desactive} indice={T.repondreIndice} onPress={onRepondre} />
      ) : (
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.reserveAuGerant)}</Text>
      )}
    </View>
  );
}
