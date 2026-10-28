import { Image } from "expo-image";
import { Text, View } from "react-native";

import { LIBELLES_RAISON_RELECTURE_PAR_LANGUE } from "@sos-miam/commun/contenus/raisons-relecture";
import type { AvisARelire } from "@sos-miam/commun/types/avis";
import { EtoilesAvis } from "~/composants/avis/EtoilesAvis";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_AVIS_A_RELIRE_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { ecrirePreuveAvis } from "~/fonctions/avis/ecrire-preuve-avis";
import { ecrireMoisAnneeLangue } from "~/fonctions/langue/ecrire-mois-annee-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserSourcePhotoAvis } from "~/hooks/utiliser-source-photo-avis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { avis: AvisARelire; desactive: boolean; onOk: () => void; onLouche: () => void; onPasser: () => void };

/**
 * Un avis à relire, sans jamais son auteur : le lieu, la note, le texte, la photo, la preuve de visite, le mois et pourquoi on
 * te le propose. Ton verdict est consultatif : l'équipe tranche.
 */
export function CarteAvisARelire({ avis: a, desactive, onOk, onLouche, onPasser }: Props) {
  const T = utiliserTextes(TEXTES_AVIS_A_RELIRE_PAR_LANGUE);
  const raisons = utiliserTextes(LIBELLES_RAISON_RELECTURE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const lireSourcePhoto = utiliserSourcePhotoAvis();
  const sourcePhoto = lireSourcePhoto(a.photo);
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <Text className="font-texte-gras text-base text-encre">{`${a.lieu.emoji} ${a.lieu.nom} · ${a.lieu.ville}`}</Text>
      <EtoilesAvis note={a.note} taille={22} />
      <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(a.texte)}</Text>
      {sourcePhoto ? <Image source={sourcePhoto} accessibilityLabel={T.photoLu} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }} contentFit="cover" /> : null}
      <Text className="font-texte text-sm text-gris">{`${ecrirePreuveAvis({ verifie: a.preuve !== null, preuve: a.preuve })} · ${ecrireMoisAnneeLangue(a.mois, langue)}`}</Text>
      <Text className="font-texte text-sm italic text-gris">{lierPonctuation(raisons[a.raison])}</Text>
      <View className="gap-2">
        <Bouton libelle={T.ok} petit desactive={desactive} onPress={onOk} />
        <Bouton libelle={T.louche} variante="blanc" petit desactive={desactive} onPress={onLouche} />
        <Bouton libelle={T.passer} variante="blanc" petit desactive={desactive} indice={T.indicePasser} onPress={onPasser} />
      </View>
    </View>
  );
}
