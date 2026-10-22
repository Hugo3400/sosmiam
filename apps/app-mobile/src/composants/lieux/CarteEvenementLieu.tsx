import { Pressable, Text, View } from "react-native";

import { TARIFS_EVENEMENT_ECRITS, TYPES_EVENEMENT_ECRITS } from "@sos-miam/commun/contenus/types-evenement";
import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { formaterPrix } from "~/fonctions/prix/formater-prix";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = { evenement: EvenementLieuPublic; interesse: boolean; onInteret: () => void };

/** Un événement à venir sur la fiche : type, titre, date, prix, places, description, « Ça m'intéresse », et le message sanitaire s'il y a de l'alcool. */
export function CarteEvenementLieu({ evenement: e, interesse, onInteret }: Props) {
  const type = TYPES_EVENEMENT_ECRITS[e.type];
  const quand = `${ecrireJourLong(e.debut)} · ${ecrireHeure(e.debut)}${e.fin ? ` – ${ecrireHeure(e.fin)}` : ""}${e.hebdoJusqua ? " · chaque semaine" : ""}`;
  const prix = e.tarif === "prix" && e.prixCentimes !== null ? formaterPrix(e.prixCentimes / 100) : TARIFS_EVENEMENT_ECRITS[e.tarif];
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="flex-row gap-3">
        <Text className="text-3xl">{type.emoji}</Text>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{e.titre}</Text>
          <Text className="font-texte text-sm text-gris">{quand}</Text>
          <Text className="font-texte text-sm text-gris">{[type.nom, prix, e.places ? `${e.places} places` : null].filter(Boolean).join(" · ")}</Text>
        </View>
      </View>
      {e.description ? (
        <Text className="font-texte text-[15px] leading-[21px] text-encre" numberOfLines={3}>
          {lierPonctuation(e.description)}
        </Text>
      ) : null}
      {e.alcool ? <MentionPrevention variante="courte" /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: interesse }}
        accessibilityLabel={interesse ? `Ça t'intéresse : ${e.titre}` : `Ça m'intéresse : ${e.titre}`}
        accessibilityHint={interesse ? "Touche pour ne plus le garder" : "On te le garde de côté"}
        onPress={onInteret}
        className={`min-h-11 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-4 py-2.5 active:opacity-80 ${interesse ? "bg-nuit" : "bg-jaune"}`}
      >
        <Text className={`font-texte-gras text-[15px] ${interesse ? "text-jaune" : "text-nuit"}`}>{interesse ? "✓ Ça m'intéresse" : "🎟️ Ça m'intéresse"}</Text>
      </Pressable>
    </View>
  );
}
