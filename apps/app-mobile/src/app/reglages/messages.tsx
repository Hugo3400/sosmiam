import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Annonce } from "~/composants/interface/Annonce";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { ChoixApercuMessages } from "~/composants/reglages/ChoixApercuMessages";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_REFUS_REGLAGE_PAR_LANGUE } from "~/contenus/textes-refus-reglage";
import { TEXTES_REGLAGES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-reglages-messages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserReglagesMessagerie } from "~/hooks/utiliser-reglages-messagerie";
import { utiliserTextes } from "~/hooks/utiliser-textes";

function expliquerRefus(erreur: ErreurService, textes: (typeof TEXTES_REFUS_REGLAGE_PAR_LANGUE)["fr"]): string {
  if (erreur === "pseudo-requis") return textes.pseudoRequis;
  if (erreur === "hors-ligne") return textes.horsLigne;
  if (erreur === "trop-de-demandes") return textes.tropDeDemandes;
  return textes.autre;
}

export default function ReglagesMessages() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_MESSAGES_PAR_LANGUE);
  const refus = utiliserTextes(TEXTES_REFUS_REGLAGE_PAR_LANGUE);
  const marges = useSafeAreaInsets();
  const { disponible, pret, reglages, changer } = utiliserReglagesMessagerie();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  function regler(changements: Parameters<typeof changer>[0]) {
    void changer(changements).then((erreur) => {
      if (erreur) setAnnonce({ texte: lierPonctuation(expliquerRefus(erreur, refus)), numero: Date.now() });
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre={T.titre} sousTitre={T.sousTitre}>
        {!disponible ? (
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.sansCompte)}
          </Text>
        ) : !pret ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
          </View>
        ) : (
          <View className="gap-8">
            <Interrupteur
              emoji="👀"
              titre={T.montrerLu}
              detail={lierPonctuation(T.montrerLuDetail)}
              valeur={reglages.accusesLecture}
              onChanger={(accusesLecture) => regler({ accusesLecture })}
            />
            <ChoixApercuMessages apercuMessages={reglages.apercuMessages} onChanger={(apercuMessages) => regler({ apercuMessages })} />
          </View>
        )}
      </EcranReglage>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
