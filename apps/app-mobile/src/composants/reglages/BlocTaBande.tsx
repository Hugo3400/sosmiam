import { ActivityIndicator, Text, View } from "react-native";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ReglagesSociaux } from "@sos-miam/commun/types/social";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { TEXTES_REFUS_REGLAGE_PAR_LANGUE } from "~/contenus/textes-refus-reglage";
import { TEXTES_REGLAGES_CONFIDENTIALITE_PAR_LANGUE } from "~/contenus/textes-reglages-confidentialite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserReglagesSociaux } from "~/hooks/utiliser-reglages-sociaux";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Dit pourquoi un interrupteur est revenu en arrière (petit message en haut de l'écran, lu par VoiceOver) */
  onAnnoncer: (texte: string) => void;
};

const INTERRUPTEURS: readonly { cle: keyof ReglagesSociaux; emoji: string }[] = [
  { cle: "trouvable", emoji: "🔍" },
  { cle: "suggerable", emoji: "🤝" },
  { cle: "activitePartagee", emoji: "🏅" },
  // Éteint, l'API ne pousse plus rien de social (messages compris) ; la cloche et les conversations, elles, se remplissent.
  // Sauf l'alerte Miam Safe d'un pote : elle part sans regarder ce réglage (API, controleurs/partages-miam-safe.ts)
  { cle: "pushSocial", emoji: "🔔" },
];

/** Pourquoi le réglage n'a pas changé */
function expliquerRefus(erreur: ErreurService, textes: (typeof TEXTES_REFUS_REGLAGE_PAR_LANGUE)["fr"]): string {
  if (erreur === "pseudo-requis") return textes.pseudoRequis;
  if (erreur === "hors-ligne") return textes.horsLigne;
  if (erreur === "trop-de-demandes") return textes.tropDeDemandes;
  return textes.autre;
}

/**
 * Réglages › Confidentialité, bloc « Ta bande » (compte connecté seulement) : qu'on te trouve par ton pseudo, te proposer
 * aux potes de tes potes, montrer ton activité à ta bande, et ses notifications. L'interrupteur bouge tout de suite ; si le
 * serveur refuse, il revient en arrière et on dit pourquoi.
 */
export function BlocTaBande({ onAnnoncer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_CONFIDENTIALITE_PAR_LANGUE).bande;
  const refus = utiliserTextes(TEXTES_REFUS_REGLAGE_PAR_LANGUE);
  const { disponible, pret, reglages, changer } = utiliserReglagesSociaux();
  if (!disponible) return null;

  function basculer(cle: keyof ReglagesSociaux, valeur: boolean) {
    void changer({ [cle]: valeur }).then((erreur) => {
      if (erreur) onAnnoncer(lierPonctuation(expliquerRefus(erreur, refus)));
    });
  }

  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>
      <Text className="mb-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(T.intro)}</Text>
      {!pret ? (
        <View className="items-center py-4">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      ) : (
        INTERRUPTEURS.map(({ cle, emoji }) => (
          <Interrupteur key={cle} emoji={emoji} titre={T.interrupteurs[cle].titre} detail={lierPonctuation(T.interrupteurs[cle].detail)} valeur={reglages[cle]} onChanger={(valeur) => basculer(cle, valeur)} />
        ))
      )}
    </View>
  );
}
