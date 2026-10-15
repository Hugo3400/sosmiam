import { Image } from "expo-image";
import { Text, View } from "react-native";

import { LIBELLES_RAISON_RELECTURE } from "@sos-miam/commun/contenus/raisons-relecture";
import type { AvisARelire } from "@sos-miam/commun/types/avis";
import { EtoilesAvis } from "~/composants/avis/EtoilesAvis";
import { Bouton } from "~/composants/interface/Bouton";
import { ecrirePreuveAvis } from "~/fonctions/avis/ecrire-preuve-avis";
import { ecrireMoisAnnee } from "~/fonctions/dates/ecrire-mois-annee";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserSourcePhotoAvis } from "~/hooks/utiliser-source-photo-avis";

type Props = { avis: AvisARelire; desactive: boolean; onOk: () => void; onLouche: () => void; onPasser: () => void };

/**
 * Un avis à relire, sans jamais son auteur : le lieu, la note, le texte, la photo, la preuve de visite, le mois et pourquoi on
 * te le propose. Ton verdict est consultatif : l'équipe tranche.
 */
export function CarteAvisARelire({ avis: a, desactive, onOk, onLouche, onPasser }: Props) {
  const lireSourcePhoto = utiliserSourcePhotoAvis();
  const sourcePhoto = lireSourcePhoto(a.photo);
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <Text className="font-texte-gras text-base text-encre">{`${a.lieu.emoji} ${a.lieu.nom} · ${a.lieu.ville}`}</Text>
      <EtoilesAvis note={a.note} taille={22} />
      <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(a.texte)}</Text>
      {sourcePhoto ? <Image source={sourcePhoto} accessibilityLabel="Photo de l'avis" style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }} contentFit="cover" /> : null}
      <Text className="font-texte text-sm text-gris">{`${ecrirePreuveAvis({ verifie: a.preuve !== null, preuve: a.preuve })} · ${ecrireMoisAnnee(a.mois)}`}</Text>
      <Text className="font-texte text-sm italic text-gris">{lierPonctuation(LIBELLES_RAISON_RELECTURE[a.raison])}</Text>
      <View className="gap-2">
        <Bouton libelle="Ça me va" petit desactive={desactive} onPress={onOk} />
        <Bouton libelle="Ça me paraît louche" variante="blanc" petit desactive={desactive} onPress={onLouche} />
        <Bouton libelle="Je passe mon tour" variante="blanc" petit desactive={desactive} indice="Si tu connais ce lieu ou la personne : un autre ambassadeur le relira" onPress={onPasser} />
      </View>
    </View>
  );
}
