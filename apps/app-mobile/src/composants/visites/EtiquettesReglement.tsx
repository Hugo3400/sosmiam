import { Text, View } from "react-native";

import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";

type Props = {
  reglement: ReglementVisite | null;
  /** « client » : « Payée », « Offerte par le lieu » ; « lieu » : « Payé », « Offert par le lieu » */
  pour: "client" | "lieu";
  taille?: "petite" | "normale";
  /** Centrer les étiquettes (célébration) plutôt que les aligner à gauche */
  centre?: boolean;
};

const FONDS = { paye: "bg-white border-encre", reduction: "bg-jaune-clair border-encre", offert: "bg-rose-alerte border-encre" } as const;

/**
 * Comment la visite a été réglée, en étiquettes : la principale (payée, avec réduction, offerte) puis les avantages.
 * La collaboration commerciale passe toujours en premier et en noir : elle doit sauter aux yeux.
 */
export function EtiquettesReglement({ reglement, pour, taille = "normale", centre = false }: Props) {
  const { titre, etiquettes } = decrireReglement(reglement, pour);
  const type = reglement?.type ?? "paye";
  const petite = taille === "petite";
  const texte = petite ? "text-xs" : "text-[13px]";
  const marge = petite ? "px-2 py-0.5" : "px-2.5 py-1";
  const lu = [titre, ...etiquettes].join(", ");

  return (
    <View accessible accessibilityLabel={lu} className={`flex-row flex-wrap gap-1.5 ${centre ? "justify-center" : ""}`}>
      <View className={`flex-row items-center rounded-full border ${marge} ${FONDS[type]}`}>
        <Text className={`font-texte-gras ${texte} text-encre`}>
          {type === "offert" ? "🎁 " : type === "paye" ? "✓ " : ""}
          {titre}
        </Text>
      </View>
      {etiquettes.map((etiquette) => {
        const commerciale = etiquette === "Collaboration commerciale";
        return (
          <View key={etiquette} className={`rounded-full border ${marge} ${commerciale ? "border-encre bg-encre" : "border-ligne bg-creme"}`}>
            <Text className={`font-texte-semi ${texte} ${commerciale ? "text-white" : "text-encre"}`}>{etiquette}</Text>
          </View>
        );
      })}
    </View>
  );
}
