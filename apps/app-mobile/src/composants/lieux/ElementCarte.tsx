import { Text, View } from "react-native";

import type { ElementCarte as DonneesElement } from "@sos-miam/commun/types/carte";
import { etiquettesCarte } from "~/contenus/etiquettes-carte";
import { formaterPrix } from "~/fonctions/prix/formater-prix";
import { formaterPrixLu } from "~/fonctions/prix/formater-prix-lu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  element: DonneesElement;
  /** Trait fin au-dessus, pour le séparer de l'élément précédent */
  separe?: boolean;
};

/** Retire le point (ou les espaces) de fin, pour recoller les phrases sans « .. » */
function sansPointFinal(texte: string): string {
  return texte.replace(/[\s.]+$/, "");
}

/**
 * Une ligne de la carte : nom, description, prix aligné à droite (avec son unité) et petits repères (⭐ signature,
 * végé, fait maison…). VoiceOver et TalkBack la lisent d'un seul tenant, sans emoji, prix en toutes lettres.
 */
export function ElementCarte({ element, separe = false }: Props) {
  const etiquettes = element.etiquettes ?? [];
  const gratuit = element.prix === 0;
  const prixLu = `${gratuit ? "gratuit" : formaterPrixLu(element.prix)}${element.unite ? ` ${element.unite}` : ""}`;
  const reperesLus = etiquettes.map((etiquette) => etiquettesCarte[etiquette].lu).join(", ");

  // « Cacio e pepe, spécialité de la maison, 12 euros. Tonnarelli, pecorino… Végétarien, fait maison. »
  const phrases = [[element.nom, ...(element.signature ? ["spécialité de la maison"] : []), prixLu].join(", ")];
  if (element.description) phrases.push(element.description);
  if (reperesLus) phrases.push(reperesLus.charAt(0).toUpperCase() + reperesLus.slice(1));
  const libelle = `${phrases.map(sansPointFinal).join(". ")}.`;

  return (
    <View accessible accessibilityLabel={libelle} className={`gap-2 py-3.5 ${separe ? "border-t border-ligne" : ""}`}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base leading-[22px] text-encre">{lierPonctuation(element.nom)}</Text>
          {element.description ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(element.description)}</Text> : null}
        </View>
        <View className="max-w-[40%] items-end">
          <Text className="font-texte-gras text-base leading-[22px] text-encre">{gratuit ? "Gratuit" : formaterPrix(element.prix)}</Text>
          {element.unite ? <Text className="text-right font-texte text-xs leading-4 text-gris">{element.unite}</Text> : null}
        </View>
      </View>

      {element.signature || etiquettes.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {element.signature ? (
            <Text className="overflow-hidden rounded-full bg-encre px-2.5 py-1 font-texte-semi text-xs text-jaune">⭐ Signature</Text>
          ) : null}
          {etiquettes.map((etiquette) => (
            <Text key={etiquette} className="overflow-hidden rounded-full bg-jaune-clair px-2.5 py-1 font-texte-moyen text-xs text-encre">
              {etiquettesCarte[etiquette].emoji} {etiquettesCarte[etiquette].libelle}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
