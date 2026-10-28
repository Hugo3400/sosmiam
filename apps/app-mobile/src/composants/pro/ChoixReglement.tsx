import { Pressable, Text, View } from "react-native";

import { LIBELLES_AVANTAGE, LIBELLES_AVANTAGE_PAR_LANGUE, LIBELLES_REGLEMENT_LIEU_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import { REDUCTIONS_POURCENT } from "@sos-miam/commun/regles/visites";
import type { AvantageVisite, ReglementVisite, TypeReglement } from "@sos-miam/commun/types/visite";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_CHOIX_REGLEMENT_PAR_LANGUE } from "~/contenus/textes-choix-reglement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  valeur: ReglementVisite;
  onChange: (reglement: ReglementVisite) => void;
};

const TYPES: readonly { type: TypeReglement; emoji: string }[] = [
  { type: "paye", emoji: "💳" },
  { type: "reduction", emoji: "🏷️" },
  { type: "offert", emoji: "🎁" },
];

const AVANTAGES: readonly AvantageVisite[] = ["recompense-fidelite", "happy-hour", "offre-sos", "partenariat", "autre"];

/**
 * Comment la visite s'est réglée, choisi par l'équipe : payée, avec réduction (pourcentage de la liste, ou sans
 * préciser) ou offerte, plus des avantages. Listes fermées : jamais de texte libre du lieu vers le client.
 */
export function ChoixReglement({ valeur, onChange }: Props) {
  const T = utiliserTextes(TEXTES_CHOIX_REGLEMENT_PAR_LANGUE);
  const libelles = utiliserTextes(LIBELLES_REGLEMENT_LIEU_PAR_LANGUE);
  const avantages = utiliserTextes(LIBELLES_AVANTAGE_PAR_LANGUE);
  const changerType = (type: TypeReglement) =>
    onChange({ ...valeur, type, reductionPourcent: type === "reduction" ? valeur.reductionPourcent : null });
  const basculerAvantage = (a: AvantageVisite) =>
    onChange({ ...valeur, avantages: valeur.avantages.includes(a) ? valeur.avantages.filter((x) => x !== a) : [...valeur.avantages, a] });

  return (
    <View className="gap-5">
      <View className="gap-2.5">
        <Text className="font-texte-gras text-base text-encre">{T.titre}</Text>
        {TYPES.map(({ type, emoji }, i) => {
          const choisi = valeur.type === type;
          const detail = T.details[type];
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={T.choixLu(libelles[type], i + 1, TYPES.length, detail)}
              accessibilityState={{ selected: choisi }}
              onPress={() => {
                vibrerLegerement();
                changerType(type);
              }}
              className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3 active:opacity-80 ${choisi ? "border-encre bg-jaune" : "border-ligne bg-carte"}`}
            >
              <Text className="text-2xl">{emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className={`font-texte-gras text-base ${choisi ? "text-nuit" : "text-encre"}`}>{libelles[type]}</Text>
                <Text className={`font-texte text-[13px] leading-[18px] ${choisi ? "text-nuit/75" : "text-gris"}`}>{lierPonctuation(detail)}</Text>
              </View>
              <View className={`h-6 w-6 items-center justify-center rounded-full border-2 border-encre ${choisi ? "bg-nuit" : "bg-carte"}`}>
                {choisi ? <View className="h-2.5 w-2.5 rounded-full bg-jaune" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {valeur.type === "reduction" ? (
        <View className="gap-2.5">
          <Text className="font-texte-gras text-base text-encre">{T.quelleReduction}</Text>
          <View className="flex-row flex-wrap gap-2">
            {REDUCTIONS_POURCENT.map((p, i) => (
              <Pastille
                key={p}
                libelle={T.reduction(p)}
                role="radio"
                position={i + 1}
                total={REDUCTIONS_POURCENT.length + 1}
                choisi={valeur.reductionPourcent === p}
                onPress={() => onChange({ ...valeur, reductionPourcent: p })}
              />
            ))}
            <Pastille
              libelle={T.sansPreciser}
              role="radio"
              position={REDUCTIONS_POURCENT.length + 1}
              total={REDUCTIONS_POURCENT.length + 1}
              choisi={valeur.reductionPourcent === null}
              onPress={() => onChange({ ...valeur, reductionPourcent: null })}
            />
          </View>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Text className="font-texte-gras text-base text-encre">{T.avantageEnPlus}</Text>
        <View className="flex-row flex-wrap gap-2">
          {AVANTAGES.map((a, i) => (
            <Pastille key={a} libelle={a === "partenariat" ? T.glosePartenariat(LIBELLES_AVANTAGE.partenariat) : avantages[a]} position={i + 1} total={AVANTAGES.length} choisi={valeur.avantages.includes(a)} onPress={() => basculerAvantage(a)} />
          ))}
        </View>
        {valeur.avantages.includes("partenariat") ? (
          <Text className="font-texte text-[13px] leading-[18px] text-gris">
            {lierPonctuation(T.notePartenariat(LIBELLES_AVANTAGE.partenariat))}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
