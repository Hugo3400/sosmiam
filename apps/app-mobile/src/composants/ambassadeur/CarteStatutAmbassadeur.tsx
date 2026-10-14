import { Text, View } from "react-native";

import type { StatutAmbassadeur } from "@sos-miam/commun/types/roles";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const TEXTES: Record<StatutAmbassadeur, { emoji: string; titre: string; texte: string }> = {
  actif: { emoji: "🤝", titre: "Ambassadeur actif", texte: "Merci de veiller sur les lieux du coin ! Tes missions, les avis à relire et les messages de l'équipe sont ici." },
  "en-attente": { emoji: "⏳", titre: "Candidature en cours", texte: "L'équipe relit ta candidature. On te prévient dès que c'est bon : garde ton plus beau tablier à portée de main." },
  refuse: { emoji: "🙏", titre: "Pas cette fois", texte: "Ta candidature n'a pas été retenue pour l'instant. Continue de sauver des tables : la porte reste ouverte." },
  suspendu: { emoji: "⏸️", titre: "Rôle en pause", texte: "Ton rôle d'ambassadeur est en pause. Un message de l'équipe t'explique pourquoi sur ambassadeur.sosmiam.fr." },
};

/** Où en est ton rôle d'ambassadeur : actif, candidature en cours, refusé ou en pause, avec un mot de l'équipe. */
export function CarteStatutAmbassadeur({ statut }: { statut: StatutAmbassadeur }) {
  const t = TEXTES[statut];
  return (
    <View accessible accessibilityLabel={`${t.titre}. ${t.texte}`} className={`flex-row gap-3 rounded-carte border-2 border-encre p-4 ${statut === "actif" ? "bg-jaune" : "bg-white"}`}>
      <Text className="text-2xl">{t.emoji}</Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre">{t.titre}</Text>
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(t.texte)}</Text>
      </View>
    </View>
  );
}
