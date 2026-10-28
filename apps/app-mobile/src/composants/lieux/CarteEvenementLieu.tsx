import { Pressable, Text, View } from "react-native";

import { TARIFS_EVENEMENT_ECRITS_PAR_LANGUE, TYPES_EVENEMENT_ECRITS_PAR_LANGUE } from "@sos-miam/commun/contenus/types-evenement";
import { formaterPrixLangue } from "@sos-miam/commun/fonctions/langue/formater-prix-langue";
import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { evenement: EvenementLieuPublic; interesse: boolean; onInteret: () => void };

/** Un événement à venir sur la fiche : type, titre, date, prix, places, description, « Ça m'intéresse », et le message sanitaire s'il y a de l'alcool. */
export function CarteEvenementLieu({ evenement: e, interesse, onInteret }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).evenements;
  const type = utiliserTextes(TYPES_EVENEMENT_ECRITS_PAR_LANGUE)[e.type];
  const tarifs = utiliserTextes(TARIFS_EVENEMENT_ECRITS_PAR_LANGUE);
  const quand = `${ecrireJourLongLangue(e.debut, langue)} · ${ecrireHeureLangue(e.debut, langue)}${e.fin ? ` – ${ecrireHeureLangue(e.fin, langue)}` : ""}${e.hebdoJusqua ? T.chaqueSemaine : ""}`;
  const prix = e.tarif === "prix" && e.prixCentimes !== null ? formaterPrixLangue(e.prixCentimes / 100, langue) : tarifs[e.tarif];
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="flex-row gap-3">
        <Text className="text-3xl">{type.emoji}</Text>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{e.titre}</Text>
          <Text className="font-texte text-sm text-gris">{quand}</Text>
          <Text className="font-texte text-sm text-gris">{[type.nom, prix, e.places ? T.places(e.places) : null].filter(Boolean).join(" · ")}</Text>
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
        accessibilityLabel={interesse ? T.interesseLu(e.titre) : T.interesserLu(e.titre)}
        accessibilityHint={interesse ? T.interesseIndice : T.interesserIndice}
        onPress={onInteret}
        className={`min-h-11 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-4 py-2.5 active:opacity-80 ${interesse ? "bg-nuit" : "bg-jaune"}`}
      >
        <Text className={`font-texte-gras text-[15px] ${interesse ? "text-jaune" : "text-nuit"}`}>{interesse ? T.interesse : T.interesser}</Text>
      </Pressable>
    </View>
  );
}
