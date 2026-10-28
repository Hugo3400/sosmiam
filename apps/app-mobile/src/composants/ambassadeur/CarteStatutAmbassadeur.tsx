import { Text, View } from "react-native";

import type { StatutAmbassadeur } from "@sos-miam/commun/types/roles";
import { STATUTS_CARTE_AMBASSADEUR_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Où en est ton rôle d'ambassadeur : actif, candidature en cours, refusé ou en pause, avec un mot de l'équipe. */
export function CarteStatutAmbassadeur({ statut }: { statut: StatutAmbassadeur }) {
  const t = utiliserTextes(STATUTS_CARTE_AMBASSADEUR_PAR_LANGUE)[statut];
  return (
    <View accessible accessibilityLabel={`${t.titre}. ${t.texte}`} className={`flex-row gap-3 rounded-carte border-2 border-encre p-4 ${statut === "actif" ? "bg-jaune" : "bg-carte"}`}>
      <Text className="text-2xl">{t.emoji}</Text>
      <View className="flex-1 gap-1">
        <Text className={`font-texte-gras text-base ${statut === "actif" ? "text-nuit" : "text-encre"}`}>{t.titre}</Text>
        <Text className={`font-texte text-sm leading-5 ${statut === "actif" ? "text-nuit" : "text-encre"}`}>{lierPonctuation(t.texte)}</Text>
      </View>
    </View>
  );
}
