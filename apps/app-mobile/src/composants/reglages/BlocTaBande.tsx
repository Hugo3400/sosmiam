import { ActivityIndicator, Text, View } from "react-native";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ReglagesSociaux } from "@sos-miam/commun/types/social";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserReglagesSociaux } from "~/hooks/utiliser-reglages-sociaux";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Dit pourquoi un interrupteur est revenu en arrière (petit message en haut de l'écran, lu par VoiceOver) */
  onAnnoncer: (texte: string) => void;
};

const INTERRUPTEURS: readonly { cle: keyof ReglagesSociaux; emoji: string; titre: string; detail: string }[] = [
  { cle: "trouvable", emoji: "🔍", titre: "Qu'on me trouve par mon pseudo", detail: "Éteint, on n'entre dans ta bande que par ton lien ou ton QR code." },
  { cle: "suggerable", emoji: "🤝", titre: "Me proposer à d'autres", detail: "On peut te suggérer aux potes de tes potes." },
  {
    cle: "activitePartagee",
    emoji: "🏅",
    titre: "Montrer mon activité à ma bande",
    detail: "Tes rescousses, tes lieux gardés et tes badges, dans Quoi de neuf et le classement.",
  },
  {
    cle: "pushSocial",
    emoji: "🔔",
    titre: "Notifications de ma bande",
    // Éteint, l'API ne pousse plus rien de social (messages compris) ; la cloche et les conversations, elles, se remplissent.
    // Sauf l'alerte Miam Safe d'un pote : elle part sans regarder ce réglage (API, controleurs/partages-miam-safe.ts)
    detail:
      "Messages, sorties et nouveaux potes, sur ton téléphone. Éteint, rien de ta bande n'y arrive, messages compris : tu retrouves tout en ouvrant l'app. Seule exception : un pote qui te prévient avec Miam Safe, ça passe toujours.",
  },
];

/** Pourquoi le réglage n'a pas changé */
function expliquerRefus(erreur: ErreurService): string {
  if (erreur === "pseudo-requis") return "🏷️ Choisis d'abord ton pseudo dans Réglages › Mes infos";
  if (erreur === "hors-ligne") return "📶 Pas de réseau : ton réglage n'a pas changé. Réessaie dans un instant.";
  if (erreur === "trop-de-demandes") return "🐢 Doucement ! Beaucoup d'essais d'un coup : réessaie dans quelques minutes.";
  return "Ça n'a pas marché cette fois : ton réglage n'a pas changé. Réessaie dans un instant.";
}

/**
 * Réglages › Confidentialité, bloc « Ta bande » (compte connecté seulement) : qu'on te trouve par ton pseudo, te proposer
 * aux potes de tes potes, montrer ton activité à ta bande, et ses notifications. L'interrupteur bouge tout de suite ; si le
 * serveur refuse, il revient en arrière et on dit pourquoi.
 */
export function BlocTaBande({ onAnnoncer }: Props) {
  const { disponible, pret, reglages, changer } = utiliserReglagesSociaux();
  if (!disponible) return null;

  function basculer(cle: keyof ReglagesSociaux, valeur: boolean) {
    void changer({ [cle]: valeur }).then((erreur) => {
      if (erreur) onAnnoncer(lierPonctuation(expliquerRefus(erreur)));
    });
  }

  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Ta bande
      </Text>
      <Text className="mb-1 font-texte text-sm leading-5 text-gris">{lierPonctuation("Qui peut te trouver, et ce que tes potes voient de toi.")}</Text>
      {!pret ? (
        <View className="items-center py-4">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement des réglages de ta bande" />
        </View>
      ) : (
        INTERRUPTEURS.map(({ cle, emoji, titre, detail }) => (
          <Interrupteur key={cle} emoji={emoji} titre={titre} detail={lierPonctuation(detail)} valeur={reglages[cle]} onChanger={(valeur) => basculer(cle, valeur)} />
        ))
      )}
    </View>
  );
}
