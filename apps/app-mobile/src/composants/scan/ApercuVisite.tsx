import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { StatutVisite, Visite } from "@sos-miam/commun/types/visite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  visite: Visite;
  onPress: () => void;
};

const STATUTS: Record<StatutVisite, { texte: string; fond: string }> = {
  demandee: { texte: "En attente", fond: "bg-jaune-clair" },
  validee: { texte: "Validée", fond: "bg-jaune" },
  refusee: { texte: "Pas validée", fond: "bg-rose-alerte" },
  annulee: { texte: "Annulée", fond: "bg-ligne" },
  expiree: { texte: "Endormie", fond: "bg-ligne" },
  retiree: { texte: "Retirée", fond: "bg-rose-alerte" },
};

const FORMAT_JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** Une visite en une ligne, dans l'aperçu de l'onglet Scan : le lieu, le jour, ce qu'elle a rapporté et son état. */
export function ApercuVisite({ visite, onPress }: Props) {
  const statut = STATUTS[visite.statut];
  const jour = FORMAT_JOUR.format(new Date(visite.valideLe ?? visite.creeLe));
  const gain = visite.statut === "validee" && visite.points > 0 ? `+${visite.points} points${visite.tampon ? " · 1 tampon" : ""}` : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[`${visite.lieu.nom}, le ${jour}`, statut.texte, gain].filter(Boolean).join(", ")}
      accessibilityHint="Ouvre le détail de la visite"
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-3.5 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-creme">
        <Text className="text-xl">{visite.lieu.emoji}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
          {visite.lieu.nom}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {jour}
          {gain ? ` · ${gain}` : ""}
        </Text>
      </View>
      <View className={`rounded-full px-2.5 py-1 ${statut.fond}`}>
        <Text className="font-texte-gras text-xs text-encre">{statut.texte}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
