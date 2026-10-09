import { Pressable, Text, View } from "react-native";

import { LIBELLES_AVANTAGE, LIBELLES_REGLEMENT_LIEU } from "@sos-miam/commun/contenus/libelles-reglement";
import { REDUCTIONS_POURCENT } from "@sos-miam/commun/regles/visites";
import type { AvantageVisite, ReglementVisite, TypeReglement } from "@sos-miam/commun/types/visite";
import { Pastille } from "~/composants/interface/Pastille";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  valeur: ReglementVisite;
  onChange: (reglement: ReglementVisite) => void;
};

const TYPES: readonly { type: TypeReglement; emoji: string; detail: string }[] = [
  { type: "paye", emoji: "💳", detail: "+15 points pour le client (+25 pendant un SOS), un tampon" },
  { type: "reduction", emoji: "🏷️", detail: "Pareil que payé : la réduction est indiquée" },
  { type: "offert", emoji: "🎁", detail: "Visite notée, ni points ni tampon ; son avis sera marqué « Repas offert »" },
];

const AVANTAGES: readonly AvantageVisite[] = ["recompense-fidelite", "happy-hour", "offre-sos", "partenariat", "autre"];

/**
 * Comment la visite s'est réglée, choisi par l'équipe : payée, avec réduction (pourcentage de la liste, ou sans
 * préciser) ou offerte, plus des avantages. Listes fermées : jamais de texte libre du lieu vers le client.
 */
export function ChoixReglement({ valeur, onChange }: Props) {
  const changerType = (type: TypeReglement) =>
    onChange({ ...valeur, type, reductionPourcent: type === "reduction" ? valeur.reductionPourcent : null });
  const basculerAvantage = (a: AvantageVisite) =>
    onChange({ ...valeur, avantages: valeur.avantages.includes(a) ? valeur.avantages.filter((x) => x !== a) : [...valeur.avantages, a] });

  return (
    <View className="gap-5">
      <View className="gap-2.5">
        <Text className="font-texte-gras text-base text-encre">Comment ça s'est réglé ?</Text>
        {TYPES.map(({ type, emoji, detail }, i) => {
          const choisi = valeur.type === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={`${LIBELLES_REGLEMENT_LIEU[type]}, ${i + 1} sur ${TYPES.length}. ${detail}`}
              accessibilityState={{ selected: choisi }}
              onPress={() => {
                vibrerLegerement();
                changerType(type);
              }}
              className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3 active:opacity-80 ${choisi ? "border-encre bg-jaune" : "border-ligne bg-white"}`}
            >
              <Text className="text-2xl">{emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="font-texte-gras text-base text-encre">{LIBELLES_REGLEMENT_LIEU[type]}</Text>
                <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(detail)}</Text>
              </View>
              <View className={`h-6 w-6 items-center justify-center rounded-full border-2 border-encre ${choisi ? "bg-encre" : "bg-white"}`}>
                {choisi ? <View className="h-2.5 w-2.5 rounded-full bg-jaune" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {valeur.type === "reduction" ? (
        <View className="gap-2.5">
          <Text className="font-texte-gras text-base text-encre">Quelle réduction ?</Text>
          <View className="flex-row flex-wrap gap-2">
            {REDUCTIONS_POURCENT.map((p, i) => (
              <Pastille
                key={p}
                libelle={`−${p} %`}
                role="radio"
                position={i + 1}
                total={REDUCTIONS_POURCENT.length + 1}
                choisi={valeur.reductionPourcent === p}
                onPress={() => onChange({ ...valeur, reductionPourcent: p })}
              />
            ))}
            <Pastille
              libelle="Sans préciser"
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
        <Text className="font-texte-gras text-base text-encre">Un avantage en plus ?</Text>
        <View className="flex-row flex-wrap gap-2">
          {AVANTAGES.map((a, i) => (
            <Pastille key={a} libelle={LIBELLES_AVANTAGE[a]} position={i + 1} total={AVANTAGES.length} choisi={valeur.avantages.includes(a)} onPress={() => basculerAvantage(a)} />
          ))}
        </View>
        {valeur.avantages.includes("partenariat") ? (
          <Text className="font-texte text-[13px] leading-[18px] text-gris">
            {lierPonctuation("Collaboration commerciale : elle sera toujours affichée sur la visite et sur l'avis du client, en toute transparence.")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
