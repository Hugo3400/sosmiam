import { Pressable, Text, View } from "react-native";

import { TYPES_EVENEMENT_ECRITS } from "@sos-miam/commun/contenus/types-evenement";
import type { EvenementLieuPro } from "@sos-miam/commun/types/evenement";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";

type Props = { evenement: EvenementLieuPro; onPress?: () => void };

/** Un événement du lieu, vu par l'équipe : type, titre, prochaine date, chaque semaine, intéressés, annulé ou suspendu. */
export function CarteEvenementPro({ evenement: e, onPress }: Props) {
  const type = TYPES_EVENEMENT_ECRITS[e.type];
  const date = e.prochaine ?? { debut: e.debut, fin: e.fin };
  const quand = `${ecrireJourLong(date.debut)} à ${ecrireHeure(date.debut)}${date.fin ? ` – ${ecrireHeure(date.fin)}` : ""}`;
  const etiquette = e.suspendu ? "Suspendu par la modération" : e.statut === "annule" ? "Annulé" : e.statut === "passe" ? "Passé" : null;
  const interesses = `${e.interesses} intéressé${e.interesses > 1 ? "s" : ""}`;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${type.nom} : ${e.titre}, ${quand}${e.hebdoJusqua ? ", chaque semaine" : ""}, ${interesses}${etiquette ? `, ${etiquette}` : ""}`}
      accessibilityHint={onPress ? "Ouvre l'événement pour le modifier ou l'annuler" : undefined}
      disabled={!onPress}
      onPress={onPress}
      className={`flex-row gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${etiquette ? "bg-creme" : "bg-white"}`}
    >
      <Text className="text-3xl">{type.emoji}</Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre" numberOfLines={2}>
          {e.titre}
        </Text>
        <Text className="font-texte text-sm text-gris">{quand}</Text>
        <Text className="font-texte text-sm text-gris">{[e.hebdoJusqua ? `Chaque semaine jusqu'au ${ecrireJourLong(e.hebdoJusqua).toLowerCase()}` : null, interesses].filter(Boolean).join(" · ")}</Text>
        {etiquette ? <Text className="font-texte-gras text-sm text-rouge-texte">{etiquette}</Text> : null}
      </View>
    </Pressable>
  );
}
