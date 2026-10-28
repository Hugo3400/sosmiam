import { ActivityIndicator, Linking, Text, View } from "react-native";

import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_BLOCS_MON_LIEU_PAR_LANGUE } from "~/contenus/textes-blocs-mon-lieu";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  charte: CharteMiamSafe | null | undefined;
  erreur: string | null;
  onReessayer: () => void;
};

const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

export function EtatCharteMiamSafe({ charte, erreur, onReessayer }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_BLOCS_MON_LIEU_PAR_LANGUE).charte;
  if (charte === undefined) return <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />;

  if (charte === null) {
    return (
      <View className="gap-3 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
        <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-encre">
          {lierPonctuation(erreur ?? T.erreur)}
        </Text>
        <Bouton libelle={T.reessayer} variante="blanc" petit onPress={onReessayer} />
      </View>
    );
  }

  if (charte.signee) {
    const texte = charte.signeeLe ? T.signeeLe(ecrireDateLongueLangue(formaterDateIso(new Date(charte.signeeLe)), langue)) : T.signee;
    return (
      <View accessible className="rounded-2xl border-2 border-encre bg-jaune p-4">
        <Text className="font-texte-gras text-base leading-6 text-nuit">🛡️ {lierPonctuation(texte)}</Text>
      </View>
    );
  }

  if (charte.retireeParEquipe) {
    return (
      <View className="gap-3 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
        <Text className="font-texte-semi text-base leading-6 text-encre">
          {lierPonctuation(T.retiree(ADRESSE_CONTACT))}
        </Text>
        <Bouton libelle={T.nousEcrire} variante="blanc" petit indice={T.nousEcrireIndice(ADRESSE_CONTACT)} onPress={() => Linking.openURL(`mailto:${ADRESSE_CONTACT}`).catch(() => {})} />
      </View>
    );
  }

  return (
    <View accessible className="rounded-2xl border-2 border-ligne bg-carte p-4">
      <Text className="font-texte-semi text-base leading-6 text-encre">{lierPonctuation(T.pasSignee)}</Text>
    </View>
  );
}
