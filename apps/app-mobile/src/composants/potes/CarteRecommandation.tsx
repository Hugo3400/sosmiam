import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, Recommandation } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_ENVOYER_A_POTE_PAR_LANGUE } from "~/contenus/textes-envoyer-a-pote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  recommandation: Recommandation;
  /** Le pote qui t'a envoyé le lieu */
  de: Pote;
  lieu: Lieu;
  /** Image du lieu (trouverVignetteLieu) ; sans image, son dégradé et son emoji */
  image: ImageSourcePropType | null;
  onOuvrir: () => void;
  /** Le menu « ⋯ » : le retirer d'ici, profil du pote, signaler ce lieu envoyé ou le profil, bloquer */
  onMenu: () => void;
  /** Posée sur la carte (utiliserPagination) : « Voir plus » y amène le lecteur d'écran */
  refPrincipal?: (vue: View | null) => void;
};

/** Un lieu envoyé par un pote : qui, le lieu en vignette, son petit mot, et « Nouveau » tant que tu ne l'as pas ouvert. */
export function CarteRecommandation({ recommandation, de, lieu, image, onOuvrir, onMenu, refPrincipal }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ENVOYER_A_POTE_PAR_LANGUE).recue;
  const nouveau = !recommandation.vue;
  const lu = [
    nouveau ? T.nouveau : null,
    T.envoieLu(de.prenom, lieu.nom, `${lieu.info}, ${ecrireQuartierVille(lieu)}`),
    recommandation.mot ? T.sonMot(recommandation.mot) : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    // Le menu « ⋯ » est posé à côté de la carte (pas dedans) : le lecteur d'écran les lit l'un après l'autre
    <View className="relative">
      <Pressable
        ref={refPrincipal}
        accessibilityRole="button"
        accessibilityLabel={lu}
        accessibilityHint={T.indiceOuvrir}
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        className={`gap-3 rounded-carte border-2 border-encre p-3.5 active:opacity-80 ${nouveau ? "bg-jaune-clair" : "bg-carte"}`}
      >
        <View className="flex-row items-center gap-2 pr-10">
          <RondPote pote={de} taille={28} />
          <Text numberOfLines={1} className="shrink font-texte-semi text-[13px] text-encre">
            {T.envoie(de.prenom)}
          </Text>
          {nouveau ? (
            <View className="rounded-full border border-encre bg-nuit px-2 py-0.5">
              <Text className="font-texte-gras text-[11px] text-jaune">{T.nouveau}</Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3">
          <VignetteLieu lieu={lieu} image={image} hauteur={56} />
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
              {lieu.nom}
            </Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              {lieu.info} · {ecrireQuartierVille(lieu)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
        </View>

        {recommandation.mot ? (
          <View className="self-start rounded-2xl rounded-tl-md border border-ligne bg-carte px-3 py-2">
            <Text className="font-texte text-sm leading-5 text-encre">{T.citerMot(recommandation.mot)}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.optionsLu(de.prenom)}
        accessibilityHint={T.indiceOptions}
        hitSlop={4}
        onPress={() => {
          vibrerLegerement();
          onMenu();
        }}
        className="absolute right-1.5 top-1.5 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
