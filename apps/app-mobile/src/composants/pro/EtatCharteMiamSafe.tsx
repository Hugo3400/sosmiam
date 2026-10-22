import { ActivityIndicator, Linking, Text, View } from "react-native";

import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  charte: CharteMiamSafe | null | undefined;
  erreur: string | null;
  onReessayer: () => void;
};

const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

export function EtatCharteMiamSafe({ charte, erreur, onReessayer }: Props) {
  const couleurs = utiliserCouleurs();
  if (charte === undefined) return <ActivityIndicator color={couleurs.encre} accessibilityLabel="On lit ta charte…" />;

  if (charte === null) {
    return (
      <View className="gap-3 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
        <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-encre">
          {lierPonctuation(erreur ?? "Oups, la charte ne s'est pas affichée.")}
        </Text>
        <Bouton libelle="Réessayer" variante="blanc" petit onPress={onReessayer} />
      </View>
    );
  }

  if (charte.signee) {
    const jour = charte.signeeLe ? ` le ${formaterDateLongue(formaterDateIso(new Date(charte.signeeLe)))}` : "";
    return (
      <View accessible className="rounded-2xl border-2 border-encre bg-jaune p-4">
        <Text className="font-texte-gras text-base leading-6 text-nuit">🛡️ {lierPonctuation(`Ton lieu a signé la charte Miam Safe${jour}.`)}</Text>
      </View>
    );
  }

  if (charte.retireeParEquipe) {
    return (
      <View className="gap-3 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
        <Text className="font-texte-semi text-base leading-6 text-encre">
          {lierPonctuation(`L'équipe SOS Miam a retiré la charte de ton lieu après un signalement. Écris-nous à ${ADRESSE_CONTACT} pour en parler.`)}
        </Text>
        <Bouton libelle="Nous écrire" variante="blanc" petit indice={`Ouvre un e-mail vers ${ADRESSE_CONTACT}`} onPress={() => Linking.openURL(`mailto:${ADRESSE_CONTACT}`).catch(() => {})} />
      </View>
    );
  }

  return (
    <View accessible className="rounded-2xl border-2 border-ligne bg-carte p-4">
      <Text className="font-texte-semi text-base leading-6 text-encre">{lierPonctuation("Ton lieu n'a pas encore signé la charte. Le badge Miam Safe sur ta fiche, c'est gratuit.")}</Text>
    </View>
  );
}
