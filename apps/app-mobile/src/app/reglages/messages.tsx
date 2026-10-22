import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Annonce } from "~/composants/interface/Annonce";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { ChoixApercuMessages } from "~/composants/reglages/ChoixApercuMessages";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserReglagesMessagerie } from "~/hooks/utiliser-reglages-messagerie";

function expliquerRefus(erreur: ErreurService): string {
  if (erreur === "pseudo-requis") return "🏷️ Choisis d'abord ton pseudo dans Profil › Modifier mon profil › Mes infos";
  if (erreur === "hors-ligne") return "📶 Pas de réseau : ton réglage n'a pas changé. Réessaie dans un instant.";
  if (erreur === "trop-de-demandes") return "🐢 Doucement ! Beaucoup d'essais d'un coup : réessaie dans quelques minutes.";
  return "Ça n'a pas marché cette fois : ton réglage n'a pas changé. Réessaie dans un instant.";
}

export default function ReglagesMessages() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const { disponible, pret, reglages, changer } = utiliserReglagesMessagerie();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  function regler(changements: Parameters<typeof changer>[0]) {
    void changer(changements).then((erreur) => {
      if (erreur) setAnnonce({ texte: lierPonctuation(expliquerRefus(erreur)), numero: Date.now() });
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre="Messages" sousTitre="Ce que tes potes voient de ta lecture, et ce que te disent tes notifications.">
        {!disponible ? (
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation("Avec un compte, tu règles ici le « Vu » et l'aperçu de tes messages dans les notifications.")}
          </Text>
        ) : !pret ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement de tes réglages" />
          </View>
        ) : (
          <View className="gap-8">
            <Interrupteur
              emoji="👀"
              titre="Montrer que j'ai lu"
              detail={lierPonctuation("Tes potes voient « Vu » sous leur message. Si tu le coupes, tu ne vois plus le leur non plus.")}
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
