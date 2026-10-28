import { memo } from "react";
import { Pressable, ScrollView, Text, View, type ImageSourcePropType } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { TEXTES_EXPLORER_LISTE_PAR_LANGUE } from "~/contenus/textes-explorer-liste";
import { ecrireDistanceDepuis } from "~/fonctions/geo/ecrire-distance-depuis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { plafonnerCarrouselSos } from "~/fonctions/lieux/plafonner-carrousel-sos";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";

type Props = {
  /** Lieux en SOS ou avec un bon plan ce soir (alerte), déjà filtrés et triés */
  sos: LieuExplorer[];
  /** Image de chaque lieu par identifiant (null : dégradé et emoji du lieu) */
  vignettes: ReadonlyMap<number, ImageSourcePropType | null>;
  onOuvrir: (id: number) => void;
  depuis: string | null;
};

const LARGEUR_CARTE = 208;
const LARGEUR_AUTRES = 150;
const PLAFOND_CARTES = 12;

/** « 🛟 SOS ce soir » : les lieux qui ont de la place ou un bon plan ce soir, en cartes qui défilent de côté. */
export const CarrouselSos = memo(function CarrouselSos({ sos, vignettes, onOuvrir, depuis }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_EXPLORER_LISTE_PAR_LANGUE);
  if (sos.length === 0) return null;
  const cartes = plafonnerCarrouselSos(sos, PLAFOND_CARTES);
  const autres = sos.length - cartes.length;
  return (
    <View className="gap-2 pb-4 pt-1">
      <View className="px-4">
        <Text accessibilityRole="header" accessibilityLabel={T.carrousel.titreLu} className="font-titre-gras text-lg text-encre">{T.carrousel.titre}</Text>
        <Text className="font-texte text-[13px] text-gris">{lierPonctuation(T.carrousel.sousTitre)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
        {cartes.map(({ lieu, km }) => {
          const distance = km === null ? null : ecrireDistanceDepuis(km, depuis, langue);
          const ligne = lieu.sos ? T.sosPlaces(lieu.sos.places, formaterHeureTexteLangue(lieu.sos.jusqua, langue)) : (lieu.alerte ?? "");
          const lu = [lieu.nom, lieu.info, lieu.sos ? T.sosLu(ligne) : ligne, lieu.sos?.offre, distance ? T.aDistanceLu(distance) : lieu.ville].filter(Boolean).join(". ");
          return (
            <Pressable
              key={lieu.id}
              accessibilityRole="button"
              accessibilityLabel={lu}
              accessibilityHint={T.ouvrirFicheIndice}
              onPress={() => {
                vibrerLegerement();
                onOuvrir(lieu.id);
              }}
              style={{ width: LARGEUR_CARTE }}
              className="overflow-hidden rounded-carte border-2 border-encre bg-carte active:opacity-80"
            >
              <View>
                <VignetteLieu lieu={lieu} image={vignettes.get(lieu.id) ?? null} hauteur={84} largeur="100%" arrondi={0} avecLogo />
                <Text
                  className={`absolute left-2 top-2 overflow-hidden rounded-full px-2 py-0.5 font-texte-gras text-xs ${lieu.sos ? "border border-encre bg-jaune text-nuit" : "bg-rose-alerte text-rouge-texte"}`}
                >
                  {lieu.sos ? "🛟 SOS" : T.carrousel.ceSoir}
                </Text>
              </View>
              <View className="gap-0.5 px-3 pb-3 pt-2">
                <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">{lieu.nom}</Text>
                <Text numberOfLines={1} className={`font-texte-semi text-[13px] ${lieu.sos ? "text-encre" : "text-rouge-texte"}`}>{ligne}</Text>
                <Text numberOfLines={2} className="font-texte text-[13px] text-gris">📍 {distance ?? lieu.ville}</Text>
                {parleDAlcool(ligne) ? <MentionPrevention variante="courte" /> : null}
              </View>
            </Pressable>
          );
        })}
        {autres > 0 ? (
          <View style={{ width: LARGEUR_AUTRES }} className="items-center justify-center gap-1 rounded-carte border-2 border-ligne bg-creme px-3 py-4">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">👇</Text>
            <Text className="text-center font-texte-semi text-[13px] text-encre">
              {lierPonctuation(T.carrousel.autres(autres))}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
});
