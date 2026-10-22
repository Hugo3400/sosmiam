import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { CarteAvisPublic } from "~/composants/avis/CarteAvisPublic";
import { Bouton } from "~/composants/interface/Bouton";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { TEXTES_AVIS_LIEU } from "~/contenus/textes-avis-lieu";
import { ecrireResumeAvis } from "~/fonctions/avis/ecrire-resume-avis";
import { filtrerAvisSelonAge } from "~/fonctions/avis/filtrer-avis-selon-age";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserAvisLieu } from "~/hooks/utiliser-avis-lieu";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSourcePhotoAvis } from "~/hooks/utiliser-source-photo-avis";

type Props = {
  lieuId: number;
  nomLieu: string;
  age: number | null;
  lieuAlcool: boolean;
};

const T = TEXTES_AVIS_LIEU;
const AVIS_AU_DEPART = 3;
const AVIS_EN_PLUS = 5;

export function SectionAvisLieu({ lieuId, nomLieu, age, lieuAlcool }: Props) {
  const couleurs = utiliserCouleurs();
  const { lecture, suiteEnCours, relire, lireSuite } = utiliserAvisLieu(lieuId);
  const lireSourcePhoto = utiliserSourcePhotoAvis();
  const [montres, setMontres] = useState(AVIS_AU_DEPART);
  const visibles = useMemo(() => (lecture.etat === "lu" ? filtrerAvisSelonAge(lecture.avis, age, lieuAlcool) : []), [lecture, age, lieuAlcool]);

  const contenu = () => {
    if (lecture.etat === "attente") {
      return (
        <View className="items-center py-4">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      );
    }
    if (lecture.etat === "erreur") {
      return (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-gris/40 px-5 py-5">
          <Text className="text-center font-texte-gras text-base text-encre">{lierPonctuation(T.erreurTitre)}</Text>
          <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation(T.erreurTexte)}</Text>
          <Bouton libelle={T.reessayer} variante="blanc" petit className="mt-1" onPress={() => void relire()} />
        </View>
      );
    }
    const resume = ecrireResumeAvis(lecture.resume);
    if (!resume) {
      return (
        <View className="gap-1 rounded-carte border-2 border-dashed border-gris/40 px-5 py-5">
          <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.videTitre)}</Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.videTexte)}</Text>
        </View>
      );
    }
    const restants = visibles.length - montres;
    const encore = restants > 0 || lecture.suite !== null;
    return (
      <>
        <View accessible accessibilityLabel={resume.lu} className="gap-1">
          <Text className="font-texte-gras text-base text-encre">{`★ ${resume.visible}`}</Text>
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.prudence)}</Text>
        </View>
        {visibles.slice(0, montres).map((avis) => (
          <View key={avis.id} className="gap-2">
            <CarteAvisPublic avis={avis} sourcePhoto={lireSourcePhoto(avis.photo)} nomLieu={nomLieu} />
            {parleDAlcool(avis.texte) || parleDAlcool(avis.reponseLieu?.texte) ? <MentionPrevention /> : null}
          </View>
        ))}
        {encore ? (
          <Bouton
            libelle={suiteEnCours ? T.voirPlusEnCours : T.voirPlus}
            variante="blanc"
            petit
            desactive={suiteEnCours}
            indice={T.voirPlusIndice}
            onPress={() => {
              setMontres((avant) => avant + AVIS_EN_PLUS);
              if (restants <= AVIS_EN_PLUS) void lireSuite();
            }}
          />
        ) : null}
      </>
    );
  };

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>
      {contenu()}
    </View>
  );
}
