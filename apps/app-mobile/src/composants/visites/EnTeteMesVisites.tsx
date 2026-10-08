import { Text, View } from "react-native";

import type { Visite } from "@sos-miam/commun/types/visite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Toutes tes visites : seules les validées sont comptées */
  visites: readonly Visite[];
};

type Chiffre = { valeur: number; singulier: string; pluriel: string };

/** Un petit mot selon le nombre de visites validées : on encourage, on ne compare jamais */
function choisirPetitMot(nombre: number): string {
  if (nombre <= 1) return "Le début d'un beau carnet de bonnes adresses.";
  if (nombre < 5) return "Tu prends le pli, et les cuisines du coin aussi.";
  if (nombre < 10) return "Les indépendants du coin commencent à te reconnaître.";
  return "Tu fais vivre le quartier, une addition après l'autre. Merci !";
}

/**
 * En tête de « Mes visites » : « 12 visites, 7 lieux, 3 villes » (visites validées seulement), les points qu'elles
 * t'ont rapportés et un petit mot qui encourage. Lu d'une traite par VoiceOver.
 */
export function EnTeteMesVisites({ visites }: Props) {
  const validees = visites.filter((v) => v.statut === "validee");
  const lieux = new Set(validees.map((v) => v.lieu.id)).size;
  const villes = new Set(validees.map((v) => v.lieu.ville.trim().toLocaleLowerCase("fr-FR"))).size;
  const points = validees.reduce((total, v) => total + v.points, 0);
  const chiffres: Chiffre[] = [
    { valeur: validees.length, singulier: "visite", pluriel: "visites" },
    { valeur: lieux, singulier: "lieu", pluriel: "lieux" },
    { valeur: villes, singulier: "ville", pluriel: "villes" },
  ];
  const nommer = (c: Chiffre) => `${c.valeur} ${c.valeur > 1 ? c.pluriel : c.singulier}`;
  const petitMot = choisirPetitMot(validees.length);
  const phrasePoints = points > 0 ? ` ${points} point${points > 1 ? "s" : ""} gagné${points > 1 ? "s" : ""} en passant à table.` : "";
  const libelle = `${nommer(chiffres[0])} validée${validees.length > 1 ? "s" : ""}, dans ${nommer(chiffres[1])} et ${nommer(chiffres[2])}.${phrasePoints} ${petitMot}`;

  return (
    <View accessible accessibilityLabel={libelle} className="gap-3 rounded-carte border-2 border-encre bg-jaune p-4">
      <View className="flex-row">
        {chiffres.map((c, i) => (
          <View key={c.singulier} className={`flex-1 items-center px-1 ${i > 0 ? "border-l-2 border-encre/15" : ""}`}>
            <Text className="font-titre text-3xl text-encre">{c.valeur}</Text>
            <Text className="font-texte-semi text-sm text-encre">{c.valeur > 1 ? c.pluriel : c.singulier}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
        <Text className="text-base">{points > 0 ? "⭐" : "🌱"}</Text>
        <Text className="flex-1 font-texte text-[13px] leading-[18px] text-encre">
          {points > 0 ? <Text className="font-texte-gras">+{points} points · </Text> : null}
          {lierPonctuation(petitMot)}
        </Text>
      </View>
    </View>
  );
}
