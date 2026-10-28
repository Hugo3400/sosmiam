import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { TEXTES_ONGLET_LISTES_PAR_LANGUE } from "~/contenus/textes-onglet-listes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu;
  /** Distance affichée (depuis le centre de ta ville quand on la connaît) ; null si on ne la connaît pas : rien ne s'affiche */
  km: number | null;
  /** Image du lieu (trouverVignetteLieu) ; sans image, son dégradé et son emoji */
  image: ImageSourcePropType | null;
  /** Dernière ligne de la carte : pas de trait dessous */
  derniere: boolean;
  onOuvrir: (id: number) => void;
  /** Seulement dans ta propre liste : un bouton pour retirer le lieu */
  onRetirer?: (lieu: Lieu) => void;
};

/** Une adresse d'une liste partagée : vignette, nom, ce que c'est, ville et distance ; la toucher ouvre sa fiche. */
export function LigneLieuListe({ lieu, km, image, derniere, onOuvrir, onRetirer }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_ONGLET_LISTES_PAR_LANGUE).ligneLieu;
  const distance = km === null ? null : formaterDistanceLangue(km, langue);

  return (
    <View className={`flex-row items-center ${derniere ? "" : "border-b border-ligne"}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${lieu.nom}, ${lieu.info}, ${lieu.ville}${distance ? `. ${T.aDistance(distance)}` : ""}`}
        accessibilityHint={T.ficheIndice}
        onPress={() => {
          vibrerLegerement();
          onOuvrir(lieu.id);
        }}
        className="min-h-16 flex-1 flex-row items-center gap-3 py-2.5 pl-3 pr-2 active:opacity-70"
      >
        <VignetteLieu lieu={lieu} image={image} hauteur={52} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {lieu.nom}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {lieu.info} · {lieu.ville}
          </Text>
          {distance ? (
            <Text numberOfLines={1} className="font-texte-moyen text-[13px] text-gris">
              📍 {distance}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
      </Pressable>

      {onRetirer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retirer(lieu.nom)}
          onPress={() => {
            vibrerLegerement();
            onRetirer(lieu);
          }}
          hitSlop={4}
          className="mr-2 h-11 w-11 items-center justify-center rounded-full active:bg-rose-alerte"
        >
          <Ionicons name="close" size={20} color={couleurs.gris} />
        </Pressable>
      ) : null}
    </View>
  );
}
