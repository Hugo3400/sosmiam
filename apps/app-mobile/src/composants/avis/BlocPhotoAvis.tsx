import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { Bouton } from "~/composants/interface/Bouton";
import type { PhotoAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  photo: PhotoAvis | null;
  pointsPhoto: number;
  repasOffert: boolean;
  preparation: boolean;
  erreur: string | null;
  desactive: boolean;
  onAjouter: () => void;
  onRetirer: () => void;
};

function decrireGainPhoto(pointsPhoto: number, repasOffert: boolean, T: typeof TEXTES_DONNER_AVIS_PAR_LANGUE.fr): string {
  if (pointsPhoto > 0) return remplirModele(T.photoPoints, { points: String(pointsPhoto) });
  return repasOffert ? T.photoPointsRepasOffert : T.photoSansPoints;
}

export function BlocPhotoAvis({ photo, pointsPhoto, repasOffert, preparation, erreur, desactive, onAjouter, onRetirer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const gain = decrireGainPhoto(pointsPhoto, repasOffert, T);
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-texte-semi text-base text-encre">
        {T.photoTitre}
        <Text className="font-texte text-gris"> ({T.photoMention})</Text>
      </Text>

      {photo ? (
        <View className="gap-3">
          <Image
            source={{ uri: photo.uri }}
            accessibilityLabel={T.photoLue}
            contentFit="cover"
            style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 2, borderColor: couleurs.encre }}
          />
          {pointsPhoto > 0 ? (
            <View className="self-start rounded-full border-2 border-encre bg-jaune px-3 py-1">
              <Text className="font-texte-gras text-[13px] text-nuit">{remplirModele(T.photoPointsAEnvoi, { points: String(pointsPhoto) })}</Text>
            </View>
          ) : null}
          <Bouton libelle={T.photoRetirer} variante="blanc" petit desactive={desactive} indice={T.photoRetirerIndice} onPress={onRetirer} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={preparation ? T.photoPreparation : T.photoAjouter}
          accessibilityHint={gain}
          accessibilityState={{ disabled: desactive || preparation, busy: preparation }}
          disabled={desactive || preparation}
          onPress={() => {
            vibrerLegerement();
            onAjouter();
          }}
          className="min-h-24 flex-row items-center gap-4 rounded-carte border-2 border-dashed border-encre bg-carte px-4 py-4 active:opacity-80"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune">
            {preparation ? <ActivityIndicator color={couleurs.nuit} /> : <Ionicons name="camera" size={22} color={couleurs.nuit} />}
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-texte-gras text-base text-encre">{preparation ? T.photoPreparation : T.photoAjouter}</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(gain)}</Text>
          </View>
        </Pressable>
      )}

      {erreur ? (
        <Text accessibilityLiveRegion="polite" className="font-texte-semi text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}
      <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.photoVisages)}</Text>
    </View>
  );
}
