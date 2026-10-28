import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import { CarteAvisPublic } from "~/composants/avis/CarteAvisPublic";
import { EncadreAvis } from "~/composants/avis/EncadreAvis";
import { Mascotte } from "~/composants/marque/Mascotte";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { CompteurPoints } from "~/composants/visites/CompteurPoints";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import type { SourcePhotoAvis } from "~/contenus/type-donner-avis";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  prenom: string;
  nomLieu: string;
  avis: AvisPublic | null;
  sourcePhoto: SourcePhotoAvis | null;
  pointsGagnes: number;
  repasOffert: boolean;
  alcool: boolean;
  refTitre?: Ref<Text>;
  onMesVisites: () => void;
};

export function MerciAvis({ prenom, nomLieu, avis, sourcePhoto, pointsGagnes, repasOffert, alcool, refTitre, onMesVisites }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const texte = T.merciTexte;
  return (
    <View className="items-center gap-5">
      <Mascotte expression="miam" taille={120} flotte />
      <View className="items-center gap-2">
        <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
          {lierPonctuation(remplirModele(T.merciTitre, { prenom }))}
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-encre">{lierPonctuation(remplirModele(texte, { chezLieu: direChezLieuLangue(nomLieu, langue) }))}</Text>
      </View>

      {pointsGagnes > 0 ? (
        <View accessible className="items-center gap-1.5">
          <CompteurPoints points={pointsGagnes} />
          <Text className="font-texte-semi text-sm text-gris">{T.merciPointsPhoto}</Text>
        </View>
      ) : null}
      {pointsGagnes === 0 && repasOffert && sourcePhoto ? <EncadreAvis emoji="🎁" texte={T.merciRepasOffert} /> : null}

      {avis ? (
        <View className="gap-3 self-stretch">
          <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
            {T.merciApercu}
          </Text>
          <CarteAvisPublic avis={avis} sourcePhoto={sourcePhoto} nomLieu={nomLieu} />
          {alcool ? <MentionPrevention /> : null}
        </View>
      ) : null}

      <EncadreAvis emoji="💬" texte={remplirModele(T.merciReponse, { lieu: nomLieu })} />
      <EncadreAvis emoji="🔎" texte={T.merciRelecture} />

      <Pressable accessibilityRole="link" hitSlop={8} onPress={onMesVisites} className="min-h-11 justify-center active:opacity-60">
        <Text className="font-texte-gras text-base text-encre underline">{T.merciMesVisites}</Text>
      </Pressable>
    </View>
  );
}
