import { Pressable, ScrollView, Text, View, type ImageSourcePropType } from "react-native";

import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Lieux en SOS ou avec un bon plan ce soir (alerte), déjà filtrés et triés */
  sos: LieuExplorer[];
  /** Image de chaque lieu par identifiant (null : dégradé et emoji du lieu) */
  vignettes: ReadonlyMap<number, ImageSourcePropType | null>;
  onOuvrir: (id: number) => void;
};

const LARGEUR_CARTE = 208;
const SOUS_TITRE = "De la place et des bons plans : ta fourchette tombe à pic.";

/** « 🛟 SOS ce soir » : les lieux qui ont de la place ou un bon plan ce soir, en cartes qui défilent de côté. */
export function CarrouselSos({ sos, vignettes, onOuvrir }: Props) {
  if (sos.length === 0) return null;
  return (
    <View className="gap-2 pb-4 pt-1">
      <View className="px-4">
        <Text accessibilityRole="header" accessibilityLabel="SOS ce soir" className="font-titre-gras text-lg text-encre">🛟 SOS ce soir</Text>
        <Text className="font-texte text-[13px] text-gris">{lierPonctuation(SOUS_TITRE)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
        {sos.map(({ lieu, km }) => {
          const distance = formaterDistance(km);
          const ligne = lieu.sos
            ? `${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}`
            : (lieu.alerte ?? "");
          const lu = [lieu.nom, lieu.info, lieu.sos ? `SOS : ${ligne}` : ligne, lieu.sos?.offre, `À ${distance}`].filter(Boolean).join(". ");
          return (
            <Pressable
              key={lieu.id}
              accessibilityRole="button"
              accessibilityLabel={lu}
              accessibilityHint="Ouvre la fiche du lieu"
              onPress={() => {
                vibrerLegerement();
                onOuvrir(lieu.id);
              }}
              style={{ width: LARGEUR_CARTE }}
              className="overflow-hidden rounded-carte border-2 border-encre bg-white active:opacity-80"
            >
              <View>
                <VignetteLieu lieu={lieu} image={vignettes.get(lieu.id) ?? null} hauteur={84} largeur="100%" arrondi={0} />
                <Text
                  className={`absolute left-2 top-2 overflow-hidden rounded-full px-2 py-0.5 font-texte-gras text-xs ${lieu.sos ? "border border-encre bg-jaune text-encre" : "bg-rose-alerte text-rouge-texte"}`}
                >
                  {lieu.sos ? "🛟 SOS" : "🔥 Ce soir"}
                </Text>
              </View>
              <View className="gap-0.5 px-3 pb-3 pt-2">
                <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">{lieu.nom}</Text>
                <Text numberOfLines={1} className={`font-texte-semi text-[13px] ${lieu.sos ? "text-encre" : "text-rouge-texte"}`}>{ligne}</Text>
                <Text numberOfLines={1} className="font-texte text-[13px] text-gris">📍 {distance}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
