import { Pressable, Text, View } from "react-native";

import type { MissionAmbassadeur, TypeMission } from "@sos-miam/commun/types/espace-ambassadeur";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

export const TYPES_MISSION: Record<TypeMission, { emoji: string; nom: string }> = {
  "verifier-lieu": { emoji: "🔎", nom: "Vérifier un lieu" },
  "verifier-big-sos": { emoji: "🆘", nom: "Vérifier un BIG SOS" },
  "controler-lieu": { emoji: "🧐", nom: "Passer voir un lieu" },
  autre: { emoji: "🧭", nom: "Mission" },
};

/** Une mission dans la liste : type, titre, lieu, échéance ou « faite le ». La toucher ouvre son détail. */
export function CarteMission({ mission: m, onPress }: { mission: MissionAmbassadeur; onPress: () => void }) {
  const type = TYPES_MISSION[m.type];
  const quand = m.statut === "faite" && m.faiteLe ? `Faite le ${ecrireJourLong(m.faiteLe).toLowerCase()}` : m.statut === "annulee" ? "Annulée" : m.echeance ? `Avant le ${ecrireJourLong(m.echeance).toLowerCase()}` : "Sans date limite";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${type.nom} : ${m.titre}${m.lieu ? `, ${m.lieu.nom}, ${m.lieu.ville}` : ""}. ${quand}`}
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
