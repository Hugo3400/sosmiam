import { Pressable, Text, View } from "react-native";

import type { MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import { TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE, TYPES_MISSION_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Une mission dans la liste : type, titre, lieu, échéance ou « faite le ». La toucher ouvre son détail. */
export function CarteMission({ mission: m, onPress }: { mission: MissionAmbassadeur; onPress: () => void }) {
  const T = utiliserTextes(TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE);
  const types = utiliserTextes(TYPES_MISSION_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const type = types[m.type];
  const quand =
    m.statut === "faite" && m.faiteLe
      ? T.faiteLe(ecrireJourLongLangue(m.faiteLe, langue))
      : m.statut === "annulee"
        ? T.annulee
        : m.echeance
          ? T.avantLe(ecrireJourLongLangue(m.echeance, langue))
          : T.sansDate;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.carteLu(type.nom, m.titre, m.lieu ? `${m.lieu.nom}, ${m.lieu.ville}` : null, quand)}
      onPress={onPress}
      className={`flex-row gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${m.statut === "a-faire" ? "bg-carte" : "bg-creme"}`}
    >
      <Text className="text-3xl">{type.emoji}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-gras text-base text-encre">{m.titre}</Text>
        {m.lieu ? <Text className="font-texte text-sm text-gris">{`${m.lieu.emoji} ${m.lieu.nom} · ${m.lieu.ville}`}</Text> : null}
        <Text className={`font-texte text-sm ${m.statut === "a-faire" ? "font-texte-gras text-encre" : "text-gris"}`}>{quand}</Text>
      </View>
    </Pressable>
  );
}
