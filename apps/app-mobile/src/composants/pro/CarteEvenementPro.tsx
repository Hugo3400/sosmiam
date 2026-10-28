import { Pressable, Text, View } from "react-native";

import { TYPES_EVENEMENT_ECRITS_PAR_LANGUE } from "@sos-miam/commun/contenus/types-evenement";
import type { EvenementLieuPro } from "@sos-miam/commun/types/evenement";
import { TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE } from "~/contenus/textes-champs-evenement";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { evenement: EvenementLieuPro; onPress?: () => void };

/** Un événement du lieu, vu par l'équipe : type, titre, prochaine date, chaque semaine, intéressés, annulé ou suspendu. */
export function CarteEvenementPro({ evenement: e, onPress }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE).carte;
  const type = utiliserTextes(TYPES_EVENEMENT_ECRITS_PAR_LANGUE)[e.type];
  const date = e.prochaine ?? { debut: e.debut, fin: e.fin };
  const quand = T.quand(ecrireJourLongLangue(date.debut, langue), ecrireHeureLangue(date.debut, langue), date.fin ? ecrireHeureLangue(date.fin, langue) : null);
  const etiquette = e.suspendu ? T.suspendu : e.statut === "annule" ? T.annule : e.statut === "passe" ? T.passe : null;
  const interesses = T.interesses(e.interesses);
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={T.lu(type.nom, e.titre, quand, Boolean(e.hebdoJusqua), interesses, etiquette)}
      accessibilityHint={onPress ? T.indice : undefined}
      disabled={!onPress}
      onPress={onPress}
      className={`flex-row gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${etiquette ? "bg-creme" : "bg-carte"}`}
    >
      <Text className="text-3xl">{type.emoji}</Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre" numberOfLines={2}>
          {e.titre}
        </Text>
        <Text className="font-texte text-sm text-gris">{quand}</Text>
        <Text className="font-texte text-sm text-gris">{[e.hebdoJusqua ? T.chaqueSemaineJusqua(ecrireJourLongLangue(e.hebdoJusqua, langue)) : null, interesses].filter(Boolean).join(" · ")}</Text>
        {etiquette ? <Text className="font-texte-gras text-sm text-rouge-texte">{etiquette}</Text> : null}
      </View>
    </Pressable>
  );
}
