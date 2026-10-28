import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { JOURS_HONNEUR_RECOMPENSES } from "@sos-miam/commun/regles/fidelite";
import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { TEXTES_FIDELITE_PAR_LANGUE } from "~/contenus/textes-fidelite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  carte: CarteFidelite;
  onPress: () => void;
};

/** La récompense en début de phrase : « Une île flottante », pas « une île flottante » */
const majuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);
const minuscule = (texte: string) => texte.charAt(0).toLocaleLowerCase("fr-FR") + texte.slice(1);

/**
 * Une carte de fidélité dans « Mes cartes » : le lieu, les tampons, ce qu'il reste à faire (ou la récompense qui t'attend),
 * et « programme en pause » si le lieu l'a arrêté. On la touche pour l'ouvrir en grand.
 */
export function CarteFideliteListe({ carte, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_FIDELITE_PAR_LANGUE);
  const prete = carte.pretes[0];
  const restantes = Math.max(0, carte.sur - carte.tampons);
  // Une récompense prête garde l'alcool de son gain ; sinon, celle vers laquelle on avance
  const alcool = prete ? prete.alcool === true : carte.recompenseAlcool;
  const phrase = prete ? T.recompenseAttend(majuscule(prete.libelle)) : T.encore(restantes, minuscule(carte.recompense));
  const lu = [
    T.carteDe(carte.lieu.nom),
    T.tamponsSur(carte.tampons, carte.sur),
    phrase.replace("🎁 ", ""),
    carte.programmeActif ? null : T.programmePauseLu,
    alcool ? T.messageSanitaireLu(MESSAGE_SANITAIRE_ALCOOL) : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint={T.ouvrirEnGrand}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${prete ? "bg-jaune-clair" : "bg-carte"}`}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{carte.lieu.emoji}</Text>
        <Text numberOfLines={1} className="flex-1 font-texte-gras text-base text-encre">
          {carte.lieu.nom}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
      </View>
      {/* Les tampons d'aujourd'hui : une carte pleine repart à zéro, sa récompense attend à côté */}
      <RangeeTampons tampons={carte.tampons} sur={carte.sur} taille="petite" />
      <Text className="font-texte-semi text-[15px] leading-[21px] text-encre">{lierPonctuation(phrase)}</Text>
      {carte.programmeActif ? null : (
        <Text className="font-texte text-[13px] text-gris">{lierPonctuation(T.programmePause(JOURS_HONNEUR_RECOMPENSES))}</Text>
      )}
      {alcool ? <MentionPrevention variante="courte" /> : null}
    </Pressable>
  );
}
